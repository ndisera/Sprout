#!/usr/bin/env python2

import argparse
import requests
import sys

from behavior_generator import BehaviorGenerator
from student_generator import Student, StudentGenerator
from teacher_generator import TeacherGenerator

from services.authorization import AuthorizationService
from services.enrollment import Enrollment, EnrollmentService
from services.section import Section, SectionService

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload students and relevant information to Sprout")
    parser.add_argument("--url", "-u", action='store', default="localhost", type=str,
                        help="hostname or IP address to connect to (default: localhost)")
    parser.add_argument("--port", "-p", action='store', default=8000, type=int,
                        help="port to connect on (default: 8000)")
    parser.add_argument("--username", "-l", action="store", type=str,
                        help="login username")
    parser.add_argument("--password", "-s", action="store", type=str,
                        help="login password (warning: insecure!)")
    parser.add_argument("--token", action="store", type=str,
                        help="auth token -- supersedes username and password")
    parser.add_argument("--setup", action="store_const", default=False, const=True,
                        help="prerelease setup script")

    args = parser.parse_args()

    if not args.token:
        args.username, args.password = AuthorizationService.display_login_prompt(args.username, args.password)

        authorizationHandler = AuthorizationService(url="https://{}".format(args.url),
                                                    port_num=args.port,
                                                    verify=False)

        try:
            args.token = authorizationHandler.send_login_request(args.username, args.password)
        except requests.exceptions.HTTPError as err:
            print "Unable to send login request:"
            print err
            sys.exit(1)

    headers = {}
    headers['Authorization'] = 'JWT ' + args.token

    student_generator = StudentGenerator(url=args.url, verify=False, headers=headers)
    teacher_generator = TeacherGenerator(url=args.url, verify=False, headers=headers)

    teachers = TeacherGenerator.generate_default_teacher_users()
    teacher_ids = []
    for teacher in teachers:
        response = teacher_generator.usersService.register_user(teacher)
        teacher_ids.append(response.json()['user']['pk'])

    students = student_generator.generate_developer_students(teacher_ids)
    response = student_generator.studentService.add_many_students(students)
    students = [Student(**data) for data in response.json()['students']]

    sections = []
    cs5510_section = Section(teacher=teacher_ids[0], title="CS 5510", id=None)
    cs4400_section = Section(teacher=teacher_ids[1], title="CS 4400", id=None)
    sections.extend((cs5510_section, cs4400_section,))

    sections_service = SectionService(headers=headers, url=args.url, verify=False, port_num=args.port)
    response = sections_service.add_many_sections(sections)
    section_ids = [section['id'] for section in response.json()['sections']]

    enrollments_service = EnrollmentService(headers=headers, url=args.url, verify=False, port_num=args.port)
    enrollments = []
    for student in students:
        for section_id in section_ids:
            enrollment = Enrollment(section=section_id, student=student.id, id=None)
            enrollments.append(enrollment)
    response = enrollments_service.add_many_enrollments(enrollments)

    enrollments = [Enrollment(**enrollment) for enrollment in response.json()['enrollments']]

    behaviors = []
    behavior_generator = BehaviorGenerator(url=args.url, verify=False, headers=headers)
    for enrollment in enrollments:
        behavior = behavior_generator.generate_random_behavior(enrollment)
        behaviors.extend(behavior)
    behavior_generator.behaviorService.add_many_behaviors(behaviors)
