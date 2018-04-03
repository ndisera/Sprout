#!/usr/bin/env python2

import argparse
import datetime
import requests
import sys
import random
import math

from lib.generators.behavior import BehaviorGenerator
from lib.generators.standardized_test_score import StandardizedTestScoreGenerator
from lib.generators.student import Student, StudentGenerator
from lib.generators.teacher import TeacherGenerator
from lib.generators.grades import GradesGenerator
from lib.generators.iep import IEPGenerator
from lib.generators.service import ServiceGenerator
from lib.generators.attendance import AttendanceGenerator

from lib.services.authorization import AuthorizationService
from lib.services.enrollment import Enrollment, EnrollmentService
from lib.services.section import Section, SectionService
from lib.services.settings import SchoolSettings, DailySchedule, TermSettings, SchoolYear, SettingsService
from lib.services.term import Term, TermService
from lib.services.users import User, UsersService

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
                        help="number of students to generate. Will scale everything based on num-students")
    parser.add_argument("--num-iep-goals", action='store', default=2, type=int,
                        help="number of IEP Goals to generate per student")
    parser.add_argument("--num-services", action='store', default=2, type=int,
                        help="number of services to generate per student")

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
                user = User(id=None, email=args.username, first_name='Admin', last_name='Admin', import_id=None)
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

    service_args = {'protocol': args.protocol,
                    'hostname': args.host,
                    'verify': False,
                    'headers': headers,
                    'port_num': args.port,
                    }
    settings_service = SettingsService(**service_args)
    term_service = TermService(**service_args)
    sections_service = SectionService(**service_args)
    enrollments_service = EnrollmentService(**service_args)

    generator_args = {'protocol': args.protocol,
                      'hostname': args.host,
                      'verify': False,
                      'headers': headers,
                      'port_num': args.port,
                      }
    attendance_generator = AttendanceGenerator(**generator_args)
    student_generator = StudentGenerator(**generator_args)
    teacher_generator = TeacherGenerator(**generator_args)
    behavior_generator = BehaviorGenerator(**generator_args)
    grades_generator = GradesGenerator(**generator_args)
    std_test_score_generator = StandardizedTestScoreGenerator(**generator_args)
    iep_generator = IEPGenerator(**generator_args)
    service_generator = ServiceGenerator(**generator_args)

    # Setup the school
    school_settings = SchoolSettings(school_name="Centennial Middle School", school_location="305 E 2320 N, Provo, UT 84604", grade_range_lower=6, grade_range_upper=8, id=1)
    settings_service.add_school(school_settings)

    school_year_start = datetime.date(year=2017, month=9, day=5)
    school_year_end = datetime.date(year=2018, month=6, day=6)
    school_year = SchoolYear(
        start_date=str(school_year_start),
        end_date=str(school_year_end),
        title="2017/18 School Year")
    response = settings_service.add_school_year(school_year)
    school_year_id = response.json()['school_years'][0]['id']

    ab_schedule = DailySchedule(name="A/B Periods", total_periods=8, periods_per_day=4, id=None)
    block_schedule = DailySchedule(name="Block Periods", total_periods=8, periods_per_day=8, id=None)
    response = settings_service.add_many_schedules([ab_schedule, block_schedule, ])
    schedule_ids = [schedule['id'] for schedule in response.json()['daily_schedules']]

    term_settings0 = TermSettings(id=None, schedule=schedule_ids[0])
    response = settings_service.add_term_settings(term_settings0)
    term_settings_id = response.json()['term_settings'][0]['id']

    term_settings1 = TermSettings(id=None, schedule=schedule_ids[1])
    response = settings_service.add_term_settings(term_settings1)
    # We don't care about this term_settings' ID

    # Setup the teachers
    teachers = []
    if args.boring:
        teachers = TeacherGenerator.generate_default_teacher_users()
    else:
        teachers = teacher_generator.generate_random_teachers(num_teachers)
    teacher_ids = []
    for teacher in teachers:
        # Assign all generated accounts a password, if one was passed, so they can be logged in
        if args.password:
            teacher_password = args.password
        else:
            teacher_password = None
        response = teacher_generator.usersService.register_user(teacher, password=teacher_password, throw_error=False)
        if response.status_code > 399:
            print response.json()
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

    # add terms
    terms = []
    term = Term(name="Fall", start_date="2017-09-05", end_date="2017-12-07", settings=term_settings_id, school_year=school_year_id, id=None, import_id=None)
    response = term_service.add_term(term)
    terms.extend([Term(**data) for data in response.json()['terms']])
    term = Term(name="Spring", start_date="2018-01-06", end_date="2018-04-24", settings=term_settings_id, school_year=school_year_id, id=None, import_id=None)
    response = term_service.add_term(term)
    terms.extend([Term(**data) for data in response.json()['terms']])

    # create term lookup
    term_lookup = {}
    for term in terms:
        term_lookup[term.id] = term

    # every teacher gets three random classes per term
    sections = []
    if args.boring:
        sections.append(Section(teacher=teacher_ids[0], title="CS 5510", term=terms[0].id, schedule_position=1, id=None, import_id=None))
        sections.append(Section(teacher=teacher_ids[1], title="CS 4400", term=terms[0].id, schedule_position=6, id=None, import_id=None))
    else:
        section_subjects = ['Math', 'English', 'Science', 'Reading', 'Social Studies', 'Spanish', 'PE', 'Study Hall',]
        for term in terms:
            for teacher in teacher_ids:
                for i in range(num_sections_per_teacher):
                    title = random.choice(section_subjects) + ' ' + str(random.randint(1000, 9999))
                    period = i + 1
                    sections.append(Section(teacher=teacher, title=title, term=term.id, schedule_position=period, id=None, import_id=None))

    response = sections_service.add_many_sections(sections)
    sections = [Section(**section) for section in response.json()['sections']]

    # create section lookup
    sections_lookup = {}
    for section in sections:
        sections_lookup[section.id] = section

    # generate ServiceRequirements
    # Depends: students, users
    services = service_generator.generate_many_random_services(num=args.num_services)
    for student_id in services:
        service_generator.serviceService.add_many_services(services[student_id], student_id)

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

    # generate behaviors. Depends: enrollments, services
    behaviors = []
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

        # moving all behaviors to one big "add" after the loop will time out the server
        # so add them one at a time in the loop
        # behaviors = behavior_generator.generate_random_behavior(enrollment, date_range_start=start_date, num_days=num_days)
        # behavior_generator.behaviorService.add_many_behaviors(behaviors)
        new_behaviors = behavior_generator.generate_random_behavior(enrollment, date_range_start=start_date, num_days=num_days)
        behaviors.extend(new_behaviors)

    # moving all behaviors to one big "add" after the loop will time out the server
    # so add them in chunks
    # TODO: make this not dumb
    split_behaviors = [[], ]
    cur_index = -1
    for i in range(0, len(behaviors)):
        if (i % 200) == 0:
            cur_index += 1
            split_behaviors.append([])
        split_behaviors[cur_index].append(behaviors[i])

    for behaviors_chunk in split_behaviors:
        # adding an empty array will error out, could happen on last array
        if len(behaviors_chunk) == 0:
            continue
        behavior_generator.behaviorService.add_many_behaviors(behaviors_chunk)

    # generate attendances. Depends: enrollments
    attendances = attendance_generator.generate_attendances(
        date_range_start=datetime.datetime.combine(school_year_start, datetime.time()),
        date_range_end=datetime.datetime.today())
    # same issue as behaviors -- adding all at once times out server
    # TODO: make this not dumb
    split_attendances = [[], ]
    cur_index = -1
    for i in range(0, len(attendances)):
        if (i % 200) == 0:
            cur_index += 1
            split_attendances.append([])
        split_attendances[cur_index].append(attendances[i])

    for attendance_chunk in split_attendances:
        if len(attendance_chunk) == 0:
            continue
        attendance_generator.attendanceService.add_many_attendance_records(attendance_chunk)

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

    # generate IEPs
    iep_goals = iep_generator.generate_many_random_iep_goals(num=args.num_iep_goals)
    for student_id in iep_goals:
        iep_generator.iepService.add_many_iep_goals(iep_goals[student_id], student_id)

    std_test_score_generator.setup_tests()
    toPost = std_test_score_generator.generate(10,
                                               range_start=datetime.date(year=2018, month=01, day=01),
                                               range_end=datetime.date(year=2018, month=07, day=01))
    std_test_score_generator.upload(toPost)








