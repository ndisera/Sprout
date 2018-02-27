#!/usr/bin/env python2

import argparse
import datetime
import requests
import sys

from behavior_generator import BehaviorGenerator
from standardized_test_score_generator import StandardizedTestScoreGenerator
from student_generator import Student, StudentGenerator
from teacher_generator import TeacherGenerator

from services.authorization import AuthorizationService
from services.enrollment import Enrollment, EnrollmentService
from services.section import Section, SectionService
from services.term import Term, TermService
from services.users import User, UsersService

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload students and relevant information to Sprout")
    parser.add_argument("--host", "-u", action='store', default="localhost", type=str,
                        help="hostname or IP address to connect to (default: localhost)")
    parser.add_argument("--port", "-p", action='store', default=8000, type=int,
                        help="port to connect on (default: 8000)")
    parser.add_argument("--protocol", action='store', default='https', type=str,
                        help="protocol to use (default: https)")
    parser.add_argument("--username", "-l", action="store", type=str,
                        help="login username")
    parser.add_argument("--password", "-s", action="store", type=str,
                        help="login password (warning: insecure!)")
    parser.add_argument("--token", action="store", type=str,
                        help="auth token -- supersedes username and password")

    args = parser.parse_args()


    if not args.token:
        args.username, args.password = AuthorizationService.display_login_prompt(args.username, args.password)

        authorizationHandler = AuthorizationService(url="https://{}".format(args.host),
                                                    port_num=args.port,
                                                    verify=False)

        try:
            args.token = authorizationHandler.send_login_request(args.username, args.password)
        except requests.exceptions.HTTPError as err:
            # Attempt to add an account with the given credentials
            try:
                print "Unable to send login request, attempting to register user"
                user_service = UsersService(protocol=args.protocol, hostname=args.host, verify=False, port_num=args.port)
                user = User(id=None, email=args.username, first_name='Admin', last_name='Admin')
                response = user_service.register_user(user, args.password)
                args.token = response.json()['token']
            except requests.exceptions.HTTPError as err:
                print "Unable to register: "
                print err
                sys.exit(1)

    headers = {}
    headers['Authorization'] = 'JWT ' + args.token

    student_generator = StudentGenerator(protocol=args.protocol, hostname=args.host, verify=False, headers=headers)
    teacher_generator = TeacherGenerator(protocol=args.protocol, hostname=args.host, verify=False, headers=headers)

    teachers = TeacherGenerator.generate_default_teacher_users()
    teacher_ids = []
    for teacher in teachers:
        response = teacher_generator.usersService.register_user(teacher)
        teacher_ids.append(response.json()['user']['pk'])

    students = student_generator.generate_developer_students(teacher_ids)
    response = student_generator.studentService.add_many_students(students)
    students = [Student(**data) for data in response.json()['students']]

    term_service = TermService(headers=headers, protocol=args.protocol, hostname=args.host, verify=False, port_num=args.port)
    term = Term(name="Spring", start_date="2018-01-06", end_date="2018-04-24", id=None)
    response = term_service.add_term(term)
    terms = [term['id'] for term in response.json()['terms']]

    sections = []
    cs5510_section = Section(teacher=teacher_ids[0], title="CS 5510", term=terms[0], id=None)
    cs4400_section = Section(teacher=teacher_ids[1], title="CS 4400", term=terms[0], id=None)
    sections.extend((cs5510_section, cs4400_section,))

    sections_service = SectionService(headers=headers, protocol=args.protocol, hostname=args.host, verify=False, port_num=args.port)
    response = sections_service.add_many_sections(sections)
    section_ids = [section['id'] for section in response.json()['sections']]

    enrollments_service = EnrollmentService(headers=headers, protocol=args.protocol, hostname=args.host, verify=False, port_num=args.port)
    enrollments = []
    for student in students:
        for section_id in section_ids:
            enrollment = Enrollment(section=section_id, student=student.id, id=None)
            enrollments.append(enrollment)
    response = enrollments_service.add_many_enrollments(enrollments)

    enrollments = [Enrollment(**enrollment) for enrollment in response.json()['enrollments']]

    behaviors = []
    behavior_generator = BehaviorGenerator(protocol=args.protocol, hostname=args.host, verify=False, headers=headers)
    for enrollment in enrollments:
        behavior = behavior_generator.generate_random_behavior(enrollment)
        behaviors.extend(behavior)
    behavior_generator.behaviorService.add_many_behaviors(behaviors)

    std_test_score_generator = StandardizedTestScoreGenerator(protocol=args.protocol, hostname=args.host, verify=False, headers=headers)
    std_test_score_generator.setup_tests()
    toPost = std_test_score_generator.generate(10,
                                               range_start=datetime.date(year=2018, month=01, day=01),
                                               range_end=datetime.date(year=2018, month=07, day=01))
    std_test_score_generator.upload(toPost)