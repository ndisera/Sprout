#!/usr/bin/env python2

import argparse
import datetime
import requests
import sys
import random
import math

from behavior_generator import BehaviorGenerator
from standardized_test_score_generator import StandardizedTestScoreGenerator
from student_generator import Student, StudentGenerator
from teacher_generator import TeacherGenerator
from grades_generator import GradesGenerator

from services.authorization import AuthorizationService
from services.enrollment import Enrollment, EnrollmentService
from services.section import Section, SectionService
from services.settings import SchoolSettings, DailySchedule, TermSettings, SettingsService
from services.term import Term, TermService
from services.users import User, UsersService
from services.assignment import Assignment, AssignmentService
from services.grades import Grade, GradesService

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload students and relevant information to Sprout")
    parser.add_argument("--protocol", action='store', default='https', type=str,
                        help="protocol to use (default: https)")
    parser.add_argument("--host", "-u", action='store', default="localhost", type=str,
                        help="hostname or IP address to connect to (default: localhost)")
    parser.add_argument("--port", "-p", action='store', default=8000, type=int,
                        help="port to connect on (default: 8000)")
    parser.add_argument("--username", "-l", action="store", type=str,
                        help="login username")
    parser.add_argument("--password", "-s", action="store", type=str,
                        help="login password (warning: insecure!)")
    parser.add_argument("--token", action="store", type=str,
                        help="auth token -- supersedes username and password")
    parser.add_argument("--boring", "-b", action="store_true",
                        help="setup with old, non randomized data")
    parser.add_argument("--num-students", "-n", action='store', default=20, type=int,
                        help="number of students to generate. will scale everything based on num-students")

    args = parser.parse_args()

    if not args.token:
        args.username, args.password = AuthorizationService.display_login_prompt(args.username, args.password)

        authorizationHandler = AuthorizationService(protocol=args.protocol,
                                                    hostname=format(args.host),
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

    # generation defaults
    num_students = args.num_students
    num_teachers = int(math.ceil((float(2) * float(num_students)) / float(5)))
    num_sections_per_teacher = int(math.ceil(float(num_teachers) / float(10)))
    num_sections_per_student = num_sections_per_teacher + 1
    num_assignments_per_section = 5
    num_grades_per_assignment = 1

    settings_service = SettingsService(headers=headers, protocol=args.protocol, hostname=args.host, verify=False, port_num=args.port)
    term_service = TermService(headers=headers, protocol=args.protocol, hostname=args.host, verify=False, port_num=args.port)
    sections_service = SectionService(headers=headers, protocol=args.protocol, hostname=args.host, verify=False, port_num=args.port)
    enrollments_service = EnrollmentService(headers=headers, protocol=args.protocol, hostname=args.host, verify=False, port_num=args.port)

    student_generator = StudentGenerator(protocol=args.protocol, hostname=args.host, verify=False, headers=headers)
    teacher_generator = TeacherGenerator(protocol=args.protocol, hostname=args.host, verify=False, headers=headers)
    behavior_generator = BehaviorGenerator(protocol=args.protocol, hostname=args.host, verify=False, headers=headers)
    grades_generator = GradesGenerator(protocol=args.protocol, hostname=args.host, verify=False, headers=headers)
    std_test_score_generator = StandardizedTestScoreGenerator(protocol=args.protocol, hostname=args.host, verify=False, headers=headers)

    # Setup the school
    school_settings = SchoolSettings(school_name="Centennial Middle School", school_location="305 E 2320 N, Provo, UT 84604", id=None)
    settings_service.add_school(school_settings)

    ab_schedule = DailySchedule(name="A/B Periods", total_periods=8, periods_per_day=4, id=None)
    block_schedule = DailySchedule(name="Block Periods", total_periods=8, periods_per_day=8, id=None)
    response = settings_service.add_many_schedules([ab_schedule, block_schedule, ])
    schedule_ids = [schedule['id'] for schedule in response.json()['daily_schedules']]

    term_settings = TermSettings(id=None, schedule=schedule_ids[0])
    response = settings_service.add_term_settings(term_settings)
    term_settings_id = response.json()['term_settings'][0]['id']

    # Setup the teachers
    teachers = []
    if args.boring:
        teachers = TeacherGenerator.generate_default_teacher_users()
    else:
        teachers = teacher_generator.generate_random_teachers(num_teachers)
    teacher_ids = []
    for teacher in teachers:
        response = teacher_generator.usersService.register_user(teacher, throw_error=False)
        if 'user' in response.json():
            teacher_ids.append(response.json()['user']['pk'])

    # Setup the students
    students = []
    if args.boring:
        students = student_generator.generate_developer_students(teacher_ids)
    else:
        students = student_generator.generate_many_random_students(num_students, teacher_ids)

    response = student_generator.studentService.add_many_students(students)
    students = [Student(**data) for data in response.json()['students']]

    terms = []
    term = Term(name="Fall", start_date="2017-08-21", end_date="2017-12-07", settings=term_settings_id, id=None)
    response = term_service.add_term(term)
    terms.extend([Term(**data) for data in response.json()['terms']])
    term = Term(name="Spring", start_date="2018-01-06", end_date="2018-04-24", settings=term_settings_id, id=None)
    response = term_service.add_term(term)
    terms.extend([Term(**data) for data in response.json()['terms']])

    # create term lookup
    term_lookup = {}
    for term in terms:
        term_lookup[term.id] = term

    # every teacher gets three random classes per term
    sections = []
    if args.boring:
        sections.append(Section(teacher=teacher_ids[0], title="CS 5510", term=terms[0].id, schedule_position=1, id=None))
        sections.append(Section(teacher=teacher_ids[1], title="CS 4400", term=terms[0].id, schedule_position=6, id=None))
    else:
        section_subjects = ['Math', 'English', 'Science', 'Reading', 'Social Studies', 'Spanish', 'PE', 'Study Hall',]
        for term in terms:
            for teacher in teacher_ids:
                for i in range(num_sections_per_teacher):
                    title = random.choice(section_subjects) + ' ' + str(random.randint(1000, 9999))
                    period = i + 1
                    sections.append(Section(teacher=teacher, title=title, term=term.id, schedule_position=period, id=None))

    response = sections_service.add_many_sections(sections)
    sections = [Section(**section) for section in response.json()['sections']]

    # create section lookup
    sections_lookup = {}
    for section in sections:
        sections_lookup[section.id] = section

    # generate enrollments
    enrollments = []
    if args.boring:
        for student in students:
            for section in sections:
                enrollments.append(Enrollment(section=section.id, student=student.id, id=None))
    else:
        for student in students:
            student_sections = set()
            for i in range(num_sections_per_student):
                new_section = random.choice(sections)
                while new_section.id in student_sections:
                    new_section = random.choice(sections)
                student_sections.add(new_section.id)
                enrollments.append(Enrollment(section=new_section.id, student=student.id, id=None))
    response = enrollments_service.add_many_enrollments(enrollments)
    enrollments = [Enrollment(**enrollment) for enrollment in response.json()['enrollments']]

    # generate behaviors
    for enrollment in enrollments:
        section = sections_lookup[enrollment.section]
        term = term_lookup[section.term]

        # generate records for every day unless I'm in the current term
        num_days = 0
        start_date = datetime.datetime.strptime(term.start_date, '%Y-%m-%d').date()
        end_date = datetime.datetime.strptime(term.end_date, '%Y-%m-%d').date()
        if end_date > datetime.date.today() and start_date < datetime.date.today():
            num_days = (datetime.date.today() - start_date).days
        else:
            num_days = (end_date - start_date).days

        behaviors = behavior_generator.generate_random_behavior(enrollment, date_range_start=start_date, num_days=num_days)
        behavior_generator.behaviorService.add_many_behaviors(behaviors)

    # generate assignments
    assignments = grades_generator.generate_assignments(num_assignments_per_section)
    for section_id in assignments.keys():
        grades_generator.assignmentService.add_many_assignments(assignments[section_id], section=section_id)

    # generate grades
    grades = grades_generator.generate_grades(num_grades_per_assignment)
    for enrollment in grades.keys():
        for section in grades[enrollment].keys():
            for assignment in grades[enrollment][section].keys():
                if len(grades[enrollment][section][assignment]) == 0:
                    continue

                grades_generator.gradeService.add_many_grades(grades[enrollment][section][assignment],
                                                              section=section,
                                                              assignment=assignment)
    

    std_test_score_generator.setup_tests()
    toPost = std_test_score_generator.generate(10,
                                               range_start=datetime.date(year=2018, month=01, day=01),
                                               range_end=datetime.date(year=2018, month=07, day=01))
    std_test_score_generator.upload(toPost)








