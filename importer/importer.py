#!/usr/bin/env python2

import os
import inspect
import argparse
import datetime
import requests
import sys
import csv
import random
import math

from sets import Set

# import data_generation lib
current_path = os.path.abspath(inspect.getsourcefile(lambda:0))
current_dir = os.path.dirname(current_path)
parent_dir = current_dir[:current_dir.rfind(os.path.sep)]

sys.path.insert(0, os.path.join(parent_dir, 'data_generation'))

from lib.services.authorization import AuthorizationService
from lib.services.enrollment import Enrollment, EnrollmentService
from lib.services.section import Section, SectionService
from lib.services.settings import SchoolSettings, DailySchedule, TermSettings, SchoolYear, SettingsService
from lib.services.term import Term, TermService
from lib.services.users import User, UsersService
from lib.services.student import Student, StudentService
from lib.services.assignment import Assignment, AssignmentService
from lib.services.grades import Grade, GradesService

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import csv data to Sprout")
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
    parser.add_argument("--folder", "-f", action="store", type=str,
                        help="absolute path to folder where csv's are stored")

    args = parser.parse_args()

    if not args.token:
        args.username, args.password = AuthorizationService.display_login_prompt(args.username, args.password)

        authorizationHandler = AuthorizationService(protocol=args.protocol,
                                                    hostname=format(args.host),
                                                    port_num=args.port,
                                                    verify=False)

        args.token = authorizationHandler.send_login_request(args.username, args.password)

    headers = {}
    headers['Authorization'] = 'JWT ' + args.token

    service_args = {
            'protocol': args.protocol,
            'hostname': args.host,
            'verify': False,
            'headers': headers,
            'port_num': args.port,
            }

    settings_service = SettingsService(**service_args)
    term_service = TermService(**service_args)
    users_service = UsersService(**service_args)
    sections_service = SectionService(**service_args)
    student_service = StudentService(**service_args)
    enrollments_service = EnrollmentService(**service_args)
    assignments_service = AssignmentService(**service_args)
    grades_service = GradesService(**service_args)

    files = {
            'terms': 'terms.csv',
            'teachers': 'teachers.csv',
            'students': 'students.csv',
            'enrollments': 'classes.csv',
            'grades': 'finalgrade.csv',
            'assignments': 'assignments.csv',
            'attendance': 'attendance.csv',
            }

    csv_headers = {
            'terms': {
                'TERMID': 'import_id',
                'FIRSTDAY': 'start_date',
                'LASTDAY': 'end_date',
                'YEARID': 'year_id',
                'ABBREVIATION': 'title',
                },
            'teachers': {
                'TEACHERNUMBER': 'import_id',
                'LAST_NAME': 'last_name',
                'FIRST_NAME': 'first_name',
                'EMAIL_ADDR': 'email',
                },
            'students': {
                'STUDENT_NUMBER': 'student_id',
                'LAST_NAME': 'last_name',
                'FIRST_NAME': 'first_name',
                'DOB': 'birthdate',
                'GRADE_LEVEL': 'grade_level',
                },
            'enrollments': {
                'STUDENT_NUMBER': 'student_id',
                'SECTIONID': 'section_import_id',
                'COURSE_NAME': 'title',
                'TEACHERNUMBER': 'teacher_import_id',
                'TERMID': 'term_import_id',
                },
            'assignments': {
                'STUDENT_NUMBER': 'student_id',
                'SECTIONID': 'section_import_id',
                'ASSIGNNAME': 'assignment_name',
                'ASSIGNMENTID': 'assignment_import_id',
                'DUEDATE': 'due_date',
                'POINTPOSSIBLE': 'score_max',
                'POINTS_EARNED': 'score',
                'PERCENT': 'percent',
                'GRADE': 'grade',
                'LATE': 'late',
                'MISSING': 'missing',
                },
            'attendance': {
                'STUDENT_NUMBER': 'student_id',
                'SECTIONID': 'section_import_id',
                'ATT_CODE': 'short_code',
                'ATT_DATE': 'date',
                'DESCRIPTION': 'description',
                'YEARID': 'year_import_id',
                },
            }

    # school years
    with open(os.path.join(args.folder, files['terms'])) as csvfile:
        print "Importing School Years"
        reader = csv.reader(csvfile)

        # set up the headers
        first_row = reader.next()
        csv_idx = {}
        i = 0
        for header in first_row:
            csv_idx[csv_headers['terms'][header]] = i
            i += 1

        # read in rows
        for row in reader:
            # check to see if I'm on a new year entry
            # year's import_id should be it's year id followed by '00'
            year_id = row[csv_idx['year_id']]
            year_id_len = len(year_id)
            split_year_id = row[csv_idx['import_id']][:year_id_len]
            split_term_id = row[csv_idx['import_id']][year_id_len:]

            if split_year_id == year_id and split_term_id == '00':
                # this is a year
                filters = { 'import_id': row[csv_idx['import_id']], }
                results = settings_service.get_school_years(filters)
                if len(results) is 0:
                    new_entry = SchoolYear(
                            id=None,
                            import_id=row[csv_idx['import_id']],
                            title=row[csv_idx['title']],
                            start_date=str(datetime.datetime.strptime(row[csv_idx['start_date']], '%Y-%m-%d %H:%M:%S').date()),
                            end_date=str(datetime.datetime.strptime(row[csv_idx['end_date']], '%Y-%m-%d %H:%M:%S').date())
                            )
                    settings_service.add_school_year(new_entry)

    # terms
    with open(os.path.join(args.folder, files['terms'])) as csvfile:
        print "Importing Terms"

        # find or create the term_settings object to use
        schedule_id = -1
        term_settings_id = -1
        term_settings_results = settings_service.get_term_settings()
        if len(term_settings_results) is 0:
            # see if there are any daily schedules to use
            daily_schedule_results = settings_service.get_schedules()
            if len(daily_schedule_results) is 0:
                # need to make a default schedule
                new_schedule = DailySchedule(id=None, name='Default', total_periods=8, periods_per_day=4)
                response = settings_service.add_schedule(new_schedule)
                schedule_id = response.json()['daily_schedules'][0]['id']
            else:
                schedule_id = daily_schedule_results[0].id

            # create a term settings object
            new_term_settings = TermSettings(id=None, schedule=schedule_id)
            response = settings_service.add_term_settings(new_term_settings)
            term_settings_id = response.json()['term_settings'][0]['id']
        else:
            term_settings_id = term_settings_results[0].id

        reader = csv.reader(csvfile)

        # set up the headers
        first_row = reader.next()
        csv_idx = {}
        i = 0
        for header in first_row:
            csv_idx[csv_headers['terms'][header]] = i
            i += 1

        # read in rows
        for row in reader:
            # check to see if I'm on a new year entry
            # year's import_id should be it's year id followed by '00'
            year_id = row[csv_idx['year_id']]
            year_id_len = len(year_id)
            split_term_id = row[csv_idx['import_id']][year_id_len:]

            if split_term_id != '00':
                # this is a term
                # see if it's already in the db
                filters = { 'import_id': row[csv_idx['import_id']], }
                results = term_service.get_terms(filters)
                if len(results) is 0:
                    # get the year this should belong to, import id of that year should be year_id followed by '00'
                    filters = { 'import_id': year_id + '00', }
                    results = settings_service.get_school_years(filters)
                    if len(results) is 0:
                        # that's not good
                        sys.exit(files['terms'] + ' contained a term with a year id that wasn\'t in the csv file and didn\'t exist in the database')
                    school_year = results[0]
                    new_entry = Term(
                            id=None,
                            import_id=row[csv_idx['import_id']],
                            name=school_year.title + ' ' + row[csv_idx['title']],
                            start_date=str(datetime.datetime.strptime(row[csv_idx['start_date']], '%Y-%m-%d %H:%M:%S').date()),
                            end_date=str(datetime.datetime.strptime(row[csv_idx['end_date']], '%Y-%m-%d %H:%M:%S').date()),
                            settings=term_settings_id,
                            school_year=school_year.id,
                            )
                    term_service.add_term(new_entry)

    # teachers
    teachers_by_import = {}
    with open(os.path.join(args.folder, files['teachers'])) as csvfile:
        print "Importing Teachers"

        # build import_id lookup
        db_results = users_service.get_users()
        for result in db_results:
            if result.import_id is not None:
                teachers_by_import[result.import_id] = result 

        reader = csv.reader(csvfile)

        # set up the headers
        first_row = reader.next()
        csv_idx = {}
        i = 0
        for header in first_row:
            csv_idx[csv_headers['teachers'][header]] = i
            i += 1

        # read in rows
        for row in reader:
            if row[csv_idx['import_id']] not in teachers_by_import:
                new_entry = User(pk=None,
                                is_active=None,
                                is_superuser=None,
                                email=row[csv_idx['email']],
                                first_name=row[csv_idx['first_name']],
                                last_name=row[csv_idx['last_name']],
                                import_id=row[csv_idx['import_id']])
                response = users_service.register_user(new_entry)
                if 'user' in response.json():
                    new_teacher = User(**response.json()['user'])
                    teachers_by_import[new_teacher.import_id] = new_teacher

    # students
    with open(os.path.join(args.folder, files['students'])) as csvfile:
        print "Importing Students"
        reader = csv.reader(csvfile)

        # set up the headers
        first_row = reader.next()
        csv_idx = {}
        i = 0
        for header in first_row:
            csv_idx[csv_headers['students'][header]] = i
            i += 1

        # read in rows
        for row in reader:
            filters = { 'student_id': row[csv_idx['student_id']], }
            results = student_service.get_students(filters)
            if len(results) is 0:
                new_entry = Student(
                        student_id=row[csv_idx['student_id']],
                        first_name=row[csv_idx['first_name']],
                        last_name=row[csv_idx['last_name']],
                        birthdate=str(datetime.datetime.strptime(row[csv_idx['birthdate']], '%Y-%m-%d %H:%M:%S').date()),
                        created=None,
                        case_manager=None,
                        picture=None,
                        grade_level=row[csv_idx['grade_level']],
                        id=None,
                        )
                student_service.add_student(new_entry)

    # sections
    with open(os.path.join(args.folder, files['enrollments'])) as csvfile:
        print "Importing Classes"
        reader = csv.reader(csvfile)

        # set up the headers
        first_row = reader.next()
        csv_idx = {}
        i = 0
        for header in first_row:
            csv_idx[csv_headers['enrollments'][header]] = i
            i += 1

        # read in rows
        for row in reader:
            filters = { 'import_id': row[csv_idx['section_import_id']], }
            results = sections_service.get_sections(filters)
            if len(results) is 0:
                # get the teacher
                if row[csv_idx['teacher_import_id']] not in teachers_by_import:
                    sys.exit(files['enrollments'] + ' contained a class with a teachernumber that wasn\'t in the csv files and didn\'t exist in the database')
                teacher = teachers_by_import[row[csv_idx['teacher_import_id']]]

                # get the term
                filters = { 'import_id': row[csv_idx['term_import_id']], }
                results = term_service.get_terms(filters)
                if len(results) is 0:
                    sys.exit(files['enrollments'] + ' contained a class with a term that wasn\'t in the csv files and didn\'t exist in the database')
                term = results[0]

                new_entry = Section(
                        id=None,
                        import_id=row[csv_idx['section_import_id']],
                        teacher=teacher.pk,
                        term=term.id,
                        title=row[csv_idx['title']],
                        schedule_position=None,
                        )
                sections_service.add_section(new_entry)

    # enrollments
    with open(os.path.join(args.folder, files['enrollments'])) as csvfile:
        print "Importing Student Enrollments"
        reader = csv.reader(csvfile)

        # set up the headers
        first_row = reader.next()
        csv_idx = {}
        i = 0
        for header in first_row:
            csv_idx[csv_headers['enrollments'][header]] = i
            i += 1

        # read in rows
        for row in reader:
            filters = { 'section.import_id': row[csv_idx['section_import_id']], 'student.student_id': row[csv_idx['student_id']], }
            results = enrollments_service.get_enrollments(filters)
            if len(results) is 0:
                # get the section
                filters = { 'import_id': row[csv_idx['section_import_id']], }
                results = sections_service.get_sections(filters)
                if len(results) is 0:
                    sys.exit('There was an error importing ' + files['enrollments'] + '. Couldn\'t find section for new enrollment.')
                section = results[0]

                # get the student
                filters = { 'student_id': row[csv_idx['student_id']], }
                results = student_service.get_students(filters)
                if len(results) is 0:
                    sys.exit(files['enrollments'] + ' contained a class with a student that wasn\'t in the csv files and didn\'t exist in the database')
                student = results[0]

                new_entry = Enrollment(id=None, section=section.id, student=student.id)
                enrollments_service.add_enrollment(new_entry)

    # assignments
    with open(os.path.join(args.folder, files['assignments'])) as csvfile:
        print "Importing Assignments and Grades"
        reader = csv.reader(csvfile)
        cleared_sections = Set()

        # set up the headers
        first_row = reader.next()
        csv_idx = {}
        i = 0
        for header in first_row:
            csv_idx[csv_headers['assignments'][header]] = i
            i += 1

        # read in rows
        for row in reader:
            # get the section
            filters = { 'import_id': row[csv_idx['section_import_id']], }
            section_results = sections_service.get_sections(filters)
            if len(results) is 0:
                sys.exit('There was an error importing ' + files['assignments'] + '. Couldn\'t find section for new assignment.')
            section = section_results[0]

            # get and delete all the assignments for this section
            # we do this because assignments/grades are not mutable in Sprout
            # and we have no way of knowing if an assignment was deleted from
            # the importing csvs, so we just re-add them
            if row[csv_idx['section_import_id']] not in cleared_sections:
                old_assignments = assignments_service.get_assignments(section.id)
                if len(old_assignments) > 0:
                    assignments_service.delete_many_assignments(old_assignments, section.id)
                cleared_sections.add(row[csv_idx['section_import_id']])

            # see if the assignment is already there
            assignment = None
            filters = { 'import_id': row[csv_idx['assignment_import_id']], }
            assignment_results = assignments_service.get_assignments(section.id, params=filters)
            if len(assignment_results) is 0:
                # add the assignment
                new_assignment = Assignment(
                                    id=None,
                                    import_id=row[csv_idx['assignment_import_id']],
                                    section=section.id,
                                    assignment_name=row[csv_idx['assignment_name']],
                                    due_date=str(datetime.datetime.strptime(row[csv_idx['due_date']], '%Y-%m-%d %H:%M:%S').date()),
                                    score_min=0,
                                    score_max=row[csv_idx['score_max']],
                                    )
                response = assignments_service.add_assignment(new_assignment, section.id)
                assignment = Assignment(**response.json()['assignments'][0])
            else:
                assignment = assignment_results[0]

            # get the student
            filters = { 'student_id': row[csv_idx['student_id']], }
            student_results = student_service.get_students(filters)
            if len(results) is 0:
                sys.exit('There was an error importing ' + files['assignments'] + '. Couldn\'t find student for new assignment.')
            student = student_results[0]
            
            # I know the grade won't be there since I deleted all assignments, so just add a new one
            new_grade = Grade(
                            id=None,
                            student=student.id,
                            assignment=assignment.id,
                            handin_datetime=row[csv_idx['due_date']],
                            score=row[csv_idx['score']],
                            grade=row[csv_idx['grade']],
                            late=(row[csv_idx['late']] == '1'),
                            missing=(row[csv_idx['missing']] == '1'),
                            )
            grades_service.add_grade(new_grade, student=student.id)

    # # attendances
    # with open(os.path.join(args.folder, files['attendance'])) as csvfile:
        # print "Importing Attendance"
        # reader = csv.reader(csvfile)

        # # set up the headers
        # first_row = reader.next()
        # csv_idx = {}
        # i = 0
        # for header in first_row:
            # csv_idx[csv_headers['attendance'][header]] = i
            # i += 1

        # # read in rows
        # for row in reader:
            # filters = { 'import_id': row[csv_idx['section_import_id']], }
            # results = sections_service.get_sections(filters)
            # if len(results) is 0:
                # # get the teacher
                # if row[csv_idx['teacher_import_id']] not in teachers_by_import:
                    # sys.exit(files['enrollments'] + ' contained a class with a teachernumber that wasn\'t in the csv files and didn\'t exist in the database')
                # teacher = teachers_by_import[row[csv_idx['teacher_import_id']]]

                # # get the term
                # filters = { 'import_id': row[csv_idx['term_import_id']], }
                # results = term_service.get_terms(filters)
                # if len(results) is 0:
                    # sys.exit(files['enrollments'] + ' contained a class with a term that wasn\'t in the csv files and didn\'t exist in the database')
                # term = results[0]

                # new_entry = Section(
                        # id=None,
                        # import_id=row[csv_idx['section_import_id']],
                        # teacher=teacher.pk,
                        # term=term.id,
                        # title=row[csv_idx['title']],
                        # schedule_position=None,
                        # )
                # sections_service.add_section(new_entry)






            # filters = { 'section.import_id': row[csv_idx['section_import_id']], 'student.student_id': row[csv_idx['student_id']], }
            # results = enrollments_service.get_enrollments(filters)
            # if len(results) is 0:
                # # get the section
                # filters = { 'import_id': row[csv_idx['section_import_id']], }
                # results = sections_service.get_sections(filters)
                # if len(results) is 0:
                    # sys.exit('There was an error importing ' + files['enrollments'] + '. Couldn\'t find section for new enrollment.')
                # section = results[0]

                # # get the student
                # filters = { 'student_id': row[csv_idx['student_id']], }
                # results = student_service.get_students(filters)
                # if len(results) is 0:
                    # sys.exit(files['enrollments'] + ' contained a class with a student that wasn\'t in the csv files and didn\'t exist in the database')
                # student = results[0]

                # new_entry = Enrollment(id=None, section=section.id, student=student.id)
                # print new_entry
                # enrollments_service.add_enrollment(new_entry)





    # Setup the school
    # school_settings = SchoolSettings(school_name="Centennial Middle School", school_location="305 E 2320 N, Provo, UT 84604", grade_range_lower=6, grade_range_upper=8, id=1)
    # settings_service.add_school(school_settings)

    # school_year_start = datetime.date(year=2017, month=9, day=5)
    # school_year_end = datetime.date(year=2018, month=6, day=6)
    # school_year = SchoolYear(
        # start_date=str(school_year_start),
        # end_date=str(school_year_end),
        # num_terms=4,
        # title="2017/18 School Year")
    # response = settings_service.add_school_year(school_year)
    # school_year_id = response.json()['school_years'][0]['id']

    # ab_schedule = DailySchedule(name="A/B Periods", total_periods=8, periods_per_day=4, id=None)
    # block_schedule = DailySchedule(name="Block Periods", total_periods=8, periods_per_day=8, id=None)
    # response = settings_service.add_many_schedules([ab_schedule, block_schedule, ])
    # schedule_ids = [schedule['id'] for schedule in response.json()['daily_schedules']]

    # term_settings0 = TermSettings(id=None, schedule=schedule_ids[0])
    # response = settings_service.add_term_settings(term_settings0)
    # term_settings_id = response.json()['term_settings'][0]['id']

    # term_settings1 = TermSettings(id=None, schedule=schedule_ids[1])
    # response = settings_service.add_term_settings(term_settings1)
    # # We don't care about this term_settings' ID

    # # Setup the teachers
    # teachers = []
    # if args.boring:
        # teachers = TeacherGenerator.generate_default_teacher_users()
    # else:
        # teachers = teacher_generator.generate_random_teachers(num_teachers)
    # teacher_ids = []
    # for teacher in teachers:
        # # Assign all generated accounts a password, if one was passed, so they can be logged in
        # if args.password:
            # teacher_password = args.password
        # else:
            # teacher_password = None
        # response = teacher_generator.usersService.register_user(teacher, password=teacher_password, throw_error=False)
        # if 'user' in response.json():
            # teacher_ids.append(response.json()['user']['pk'])

    # # Setup the students
    # students = []
    # if args.boring:
        # students = student_generator.generate_developer_students(teacher_ids)
    # else:
        # students = student_generator.generate_many_random_students(num_students, teacher_ids)

    # response = student_generator.studentService.add_many_students(students)
    # students = [Student(**data) for data in response.json()['students']]

    # terms = []
    # term = Term(name="Fall", start_date="2017-08-21", end_date="2017-12-07", settings=term_settings_id, school_year=school_year_id, id=None)
    # response = term_service.add_term(term)
    # terms.extend([Term(**data) for data in response.json()['terms']])
    # term = Term(name="Spring", start_date="2018-01-06", end_date="2018-04-24", settings=term_settings_id, school_year=school_year_id, id=None)
    # response = term_service.add_term(term)
    # terms.extend([Term(**data) for data in response.json()['terms']])

    # # create term lookup
    # term_lookup = {}
    # for term in terms:
        # term_lookup[term.id] = term

    # # every teacher gets three random classes per term
    # sections = []
    # if args.boring:
        # sections.append(Section(teacher=teacher_ids[0], title="CS 5510", term=terms[0].id, schedule_position=1, id=None))
        # sections.append(Section(teacher=teacher_ids[1], title="CS 4400", term=terms[0].id, schedule_position=6, id=None))
    # else:
        # section_subjects = ['Math', 'English', 'Science', 'Reading', 'Social Studies', 'Spanish', 'PE', 'Study Hall',]
        # for term in terms:
            # for teacher in teacher_ids:
                # for i in range(num_sections_per_teacher):
                    # title = random.choice(section_subjects) + ' ' + str(random.randint(1000, 9999))
                    # period = i + 1
                    # sections.append(Section(teacher=teacher, title=title, term=term.id, schedule_position=period, id=None))

    # response = sections_service.add_many_sections(sections)
    # sections = [Section(**section) for section in response.json()['sections']]

    # # create section lookup
    # sections_lookup = {}
    # for section in sections:
        # sections_lookup[section.id] = section

    # # generate enrollments
    # enrollments = []
    # if args.boring:
        # for student in students:
            # for section in sections:
                # enrollments.append(Enrollment(section=section.id, student=student.id, id=None))
    # else:
        # for student in students:
            # student_sections = set()
            # for i in range(num_sections_per_student):
                # new_section = random.choice(sections)
                # while new_section.id in student_sections:
                    # new_section = random.choice(sections)
                # student_sections.add(new_section.id)
                # enrollments.append(Enrollment(section=new_section.id, student=student.id, id=None))
    # response = enrollments_service.add_many_enrollments(enrollments)
    # enrollments = [Enrollment(**enrollment) for enrollment in response.json()['enrollments']]

    # # generate behaviors. Depends: enrollments
    # behaviors = []
    # for enrollment in enrollments:
        # section = sections_lookup[enrollment.section]
        # term = term_lookup[section.term]

        # # generate records for every day unless I'm in the current term
        # num_days = 0
        # start_date = datetime.datetime.strptime(term.start_date, '%Y-%m-%d').date()
        # end_date = datetime.datetime.strptime(term.end_date, '%Y-%m-%d').date()
        # if end_date > datetime.date.today() and start_date < datetime.date.today():
            # num_days = (datetime.date.today() - start_date).days
        # else:
            # num_days = (end_date - start_date).days

        # # moving all behaviors to one big "add" after the loop will time out the server
        # # so add them one at a time in the loop
        # # behaviors = behavior_generator.generate_random_behavior(enrollment, date_range_start=start_date, num_days=num_days)
        # # behavior_generator.behaviorService.add_many_behaviors(behaviors)
        # new_behaviors = behavior_generator.generate_random_behavior(enrollment, date_range_start=start_date, num_days=num_days)
        # behaviors.extend(new_behaviors)

    # # moving all behaviors to one big "add" after the loop will time out the server
    # # so add them in chunks
    # # TODO: make this not dumb
    # split_behaviors = [[], ]
    # cur_index = -1
    # for i in range(0, len(behaviors)):
        # if (i % 200) == 0:
            # cur_index += 1
            # split_behaviors.append([])
        # split_behaviors[cur_index].append(behaviors[i])

    # for behaviors_chunk in split_behaviors:
        # # adding an empty array will error out, could happen on last array
        # if len(behaviors_chunk) == 0:
            # continue
        # behavior_generator.behaviorService.add_many_behaviors(behaviors_chunk)

    # # generate attendances. Depends: enrollments
    # attendances = attendance_generator.generate_attendances(
        # date_range_start=datetime.datetime.combine(school_year_start, datetime.time()),
        # date_range_end=datetime.datetime.today())
    # # same issue as behaviors -- adding all at once times out server
    # # TODO: make this not dumb
    # split_attendances = [[], ]
    # cur_index = -1
    # for i in range(0, len(attendances)):
        # if (i % 200) == 0:
            # cur_index += 1
            # split_attendances.append([])
        # split_attendances[cur_index].append(attendances[i])

    # for attendance_chunk in split_attendances:
        # if len(attendance_chunk) == 0:
            # continue
        # attendance_generator.attendanceService.add_many_attendance_records(attendance_chunk)

    # # generate assignments
    # assignments = grades_generator.generate_assignments(num_assignments_per_section)
    # for section_id in assignments.keys():
        # grades_generator.assignmentService.add_many_assignments(assignments[section_id], section=section_id)

    # # generate grades
    # grades = grades_generator.generate_grades(num_grades_per_assignment)
    # for enrollment in grades.keys():
        # for section in grades[enrollment].keys():
            # for assignment in grades[enrollment][section].keys():
                # if len(grades[enrollment][section][assignment]) == 0:
                    # continue

                # grades_generator.gradeService.add_many_grades(grades[enrollment][section][assignment],
                                                              # section=section,
                                                              # assignment=assignment)

    # # generate IEPs
    # iep_goals = iep_generator.generate_many_random_iep_goals(num=args.num_iep_goals)
    # for student_id in iep_goals:
        # iep_generator.iepService.add_many_iep_goals(iep_goals[student_id], student_id)

    # # generate ServiceRequirements
    # services = service_generator.generate_many_random_services(num=args.num_services)
    # for student_id in services:
        # service_generator.serviceService.add_many_services(services[student_id], student_id)

    # std_test_score_generator.setup_tests()
    # toPost = std_test_score_generator.generate(10,
                                               # range_start=datetime.date(year=2018, month=01, day=01),
                                               # range_end=datetime.date(year=2018, month=07, day=01))
    # std_test_score_generator.upload(toPost)








