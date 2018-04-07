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
import urllib3

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
from lib.services.attendance import AttendanceRecord, AttendanceService

def escape_string(string):
    to_escape = [
            ('\\', '\\\\'),
            ('"', '\\"'),
            (',', '\\,'),
            ]

    for seq in to_escape:
        string = string.replace(seq[0], seq[1])
    return string

if __name__ == "__main__":
    # disable annoying warnings
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

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
    attendance_service = AttendanceService(**service_args)

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

    # preprocess assignments
    with open(os.path.join(args.folder, files['assignments'])) as csvfile:
        with open(os.path.join(args.folder, 'temp_' + files['assignments']), 'w+') as newcsvfile:
            print 'pre-processing csv\'s...'

            first_read = False
            for row in csvfile:
                if not first_read:
                    first_read = True
                    newcsvfile.write(row)
                    continue

                left_index = 0
                right_index = len(row) - 1
                for i in range(0, 2):
                    left_index += (row[left_index:].find(',') + 1)
                for i in range(0, 8):
                    right_index = (row[:right_index].rfind(','))

                if row[left_index] == '"' and row[right_index - 1] == '"':
                    left_index += 1
                    right_index -= 1

                escaped_string = escape_string(row[left_index:right_index])
                newcsvfile.write(row[:left_index] + escaped_string + row[right_index:])
            print 'done pre-processing csv\'s'
            print ''

    # school years
    with open(os.path.join(args.folder, files['terms'])) as csvfile:
        print 'importing school years...'
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

            print 'importing year ' + year_id + '\r',
            sys.stdout.flush()

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
        print 'done importing school years          \r'
        print ''

    # terms
    with open(os.path.join(args.folder, files['terms'])) as csvfile:
        print 'importing terms...'

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
            print 'importing school term ' + row[csv_idx['import_id']] + '\r',
            sys.stdout.flush()

            # check to see if I'm on a new year entry
            # year's import_id should be it's year id followed by '00'
            year_id = row[csv_idx['year_id']]
            year_id_len = len(year_id)
            split_term_id = row[csv_idx['import_id']][year_id_len:]


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

                # prefix term name with year if it's not the 'year term'
                term_name = school_year.title
                if school_year.import_id != row[csv_idx['import_id']]:
                    term_name += (' ' + row[csv_idx['title']])

                new_entry = Term(
                        id=None,
                        import_id=row[csv_idx['import_id']],
                        name=term_name,
                        start_date=str(datetime.datetime.strptime(row[csv_idx['start_date']], '%Y-%m-%d %H:%M:%S').date()),
                        end_date=str(datetime.datetime.strptime(row[csv_idx['end_date']], '%Y-%m-%d %H:%M:%S').date()),
                        settings=term_settings_id,
                        school_year=school_year.id,
                        )
                term_service.add_term(new_entry)
        print 'done importing terms          \r'
        print ''

    # teachers
    teachers_by_import = {}
    with open(os.path.join(args.folder, files['teachers'])) as csvfile:
        print 'importing teachers...'

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
            print 'importing teacher ' + row[csv_idx['import_id']] + '\r',
            sys.stdout.flush()

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

        print 'done importing teachers          \r'
        print ''

    # students
    with open(os.path.join(args.folder, files['students'])) as csvfile:
        print 'importing students...'
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
            print 'importing student ' + row[csv_idx['student_id']] + '\r',
            sys.stdout.flush()

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
        print 'done importing students          \r'
        print ''

    # sections
    with open(os.path.join(args.folder, files['enrollments'])) as csvfile:
        print 'importing sections...'
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
            print 'importing section ' + row[csv_idx['section_import_id']] + '\r',
            sys.stdout.flush()

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
                    print row
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
        print 'done importing sections          \r'
        print ''

    # enrollments
    with open(os.path.join(args.folder, files['enrollments'])) as csvfile:
        print 'importing student enrollments...'
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
            print 'importing enrollment for student ' + row[csv_idx['student_id']] + ' in section ' + row[csv_idx['section_import_id']] + '\r',
            sys.stdout.flush()

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
        print 'done importing enrollments                                                 \r'
        print ''

    # assignments
    with open(os.path.join(args.folder, 'temp_' + files['assignments'])) as csvfile:
        print 'importing assignments and grades...'
        reader = csv.reader(csvfile, escapechar='\\')
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
            print 'importing assignment ' + row[csv_idx['assignment_import_id']] + ' for student ' + row[csv_idx['student_id']] + '\r',
            sys.stdout.flush()

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

            # make sure this is a valid score
            try:
                float(row[csv_idx['score']])
            except ValueError:
                continue

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
        print 'done importing assignments and grades                               \r'
        print ''

    # attendances
    with open(os.path.join(args.folder, files['attendance'])) as csvfile:
        print 'importing attendance...'
        reader = csv.reader(csvfile)
        cleared_enrollments = Set()

        # set up the headers
        first_row = reader.next()
        csv_idx = {}
        i = 0
        for header in first_row:
            csv_idx[csv_headers['attendance'][header]] = i
            i += 1

        missing_enrollments = 0

        # read in rows
        for row in reader:
            print 'importing attendance for student ' + row[csv_idx['student_id']] + ' for section ' + row[csv_idx['section_import_id']] + '\r',
            sys.stdout.flush()

            # get the enrollment
            filters = { 'student.student_id': row[csv_idx['student_id']], 'section.import_id': row[csv_idx['section_import_id']], }
            enrollment_results = enrollments_service.get_enrollments(params=filters)
            if len(enrollment_results) is 0:
                missing_enrollments += 1
                continue
                # sys.exit(files['attendance'] + ' contained an attendance with an enrollment (student and section) that wasn\'t in the csv files and didn\'t exist in the database')

            enrollment = enrollment_results[0]

            # get and delete all the attendances for this enrollment
            # we do this because attendances are immutable in Sprout
            # and we have no way of knowing if an attendance was deleted from
            # the importing csvs, so we just re-add them
            if enrollment.id not in cleared_enrollments:
                filters = { 'enrollment': enrollment.id, }
                old_attendances = attendance_service.get_attendances(filters)
                if len(old_attendances) > 0:
                    attendance_service.delete_many_attendance_records(old_attendances)
                cleared_enrollments.add(enrollment.id)

            # I know the attendance record won't be there since I deleted them all, so just add it
            new_attendance_record = AttendanceRecord(
                                            id=None,
                                            enrollment=enrollment.id,
                                            date=row[csv_idx['date']],
                                            short_code=row[csv_idx['short_code']],
                                            description=row[csv_idx['description']],
                                            )
            attendance_service.add_attendance_record(new_attendance_record)

    print 'done importing attendance                                                  \r'
    if missing_enrollments > 0:
        print files['attendance'] + ' had ' + str(missing_enrollments) + ' enrollments that weren\'t in the csv files and didn\'t exist in the database. They weren\'t added.'
    print ''
    print 'done importing'
