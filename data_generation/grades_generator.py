#!/usr/bin/env python2

import argparse
import datetime
import random
import requests
import sys

from services.authorization import AuthorizationService

from services.assignment import Assignment, AssignmentService

from services.enrollment import EnrollmentService

from services.grades import GradesService, Grade

ASSIGNMENT_NAMES = ['Homework',  'Quiz', 'Worksheet']

class GradesGenerator():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=False):
        self.gradeService = GradesService(headers=headers, url=url, port_num=port_num, verify=verify)
        self.assignmentService = AssignmentService(headers=headers, url=url, port_num=port_num, verify=verify)
        self.enrollmentService = EnrollmentService(headers=headers, url=url, port_num=port_num, verify=verify)

    def parse_enrollments(self, enrollments):
        students = set()
        sections = set()

        for enrollment in enrollments:
            students.add(enrollment.student)
            sections.add(enrollment.section)

        return students, sections

    def generate_assignments(self, num,
                 range_start=datetime.date(year=2018, month=01, day=12),
                 range_end=datetime.date.today()):
        """
        Generate num number of grades for each current enrollment in the given range

        :param num:
        :param range_start: Date to start random date generation
        :param range_end: Date to end random date generation
        :return:
        """

        assignments = []
        enrollments = self.enrollmentService.get_enrollments()
        students, sections = self.parse_enrollments(enrollments)

        for sectionID in sections:
            # For each section, generate a list of assignment names and due dates
            names = set() # Keep set of generated names to avoid duplicates
            dates = set() # Avoid duplicates
            date_diff = range_end - range_start

            for count in range(0, num):
                while True: # Generate a name until we get a non-dupe
                    name = '{} {}'.format(random.choice(ASSIGNMENT_NAMES), random.randint(1, 9))
                    if not name in names:
                        break
                while True: # Generate a date until we get a non-dupe
                    date = range_start + datetime.timedelta(days=random.randint(0, date_diff.days))
                    if not date in dates:
                        break
                names.add(name)
                dates.add(date)

                # For now, all assignments are 0-100
                score_min = 0
                score_max = 100

                assignment = Assignment(section=sectionID,
                                        assignment_name=name,
                                        due_date=str(date),
                                        score_min=score_min,
                                        score_max=score_max,
                                        id=None)
                assignments.append(assignment)

        return assignments


    def generate_grades(self, num,
                        range_start=datetime.date(year=2018, month=01, day=12),
                        range_end=datetime.date.today()):
        """
        Generate num number of grades for each current enrollment in the given range

        :param num:
        :param range_start: Date to start random date generation
        :param range_end: Date to end random date generation
        :return:
        """

        toPost = []

        assignments = self.assignmentService.get_assignments()

        enrollments = self.enrollmentService.get_enrollments()
        (students, sections) = self.parse_enrollments(enrollments)

        for assignment in assignments:
            section = assignment.section

            for student in students:
                # Find the original enrollment (if it exists)
                enrollment = None
                for e in enrollments:
                    if e.student is student and e.section is section:
                        enrollment = e
                        break
                if enrollment is None:
                    # If the student was not in this class, move along
                    continue

                # For each student and section, randomly decide a grade range
                grade_average = random.randint(assignment.score_min, assignment.score_max)
                assignment_score_range = assignment.score_max - assignment.score_min
                grade_spread = random.randint(0, assignment_score_range / 6)

                grade_max = grade_average + grade_spread
                grade_min = grade_average - grade_spread
                # Avoid overflowing the min/max grade
                grade_max = min(grade_max, assignment.score_max)
                grade_min = max(grade_min, assignment.score_min)

                # calculate when the assignment was turned in
                duedate = datetime.datetime.strptime(assignment.due_date, '%Y-%m-%d')

                # Now generate the number of grades we were supposed to generate
                for unused in range(num):
                    late_modifier = random.randint(0, 9)
                    handin = datetime.datetime.now();
                    if late_modifier > 8:
                        print 'assignment was late!'
                        handin = datetime.datetime(duedate.year, duedate.month, duedate.day + 1, handin.hour, handin.minute, handin.second, handin.microsecond)
                    else:
                        handin = datetime.datetime(duedate.year, duedate.month, duedate.day - 1, handin.hour, handin.minute, handin.second, handin.microsecond)

                    score = random.randint(grade_min, grade_max)
                    grade = Grade(assignment=assignment.id,
                                  score=score,
                                  student=student,
                                  handin_datetime=str(handin),
                                  id=None)
                    toPost.append(grade)

        return toPost


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload random grade information to Sprout")
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
    parser.add_argument("--num-scores", action="store", type=int, default=5,
                        help="number of datapoints to generate")
    parser.add_argument("--setup-num-assign", action="store", type=int,
                        help="generate and upload this number of assignments")

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

    headers = { 'Authorization': 'JWT {}'.format(args.token)}

    generator = GradesGenerator(url=args.url, port_num=args.port, headers=headers, verify=False)

    if args.setup_num_assign is not None:
        assignments = generator.generate_assignments(args.setup_num_assign)
        generator.assignmentService.add_many_assignments(assignments)
    else:
        grades = generator.generate_grades(args.num_scores)
        generator.gradeService.add_many_grades(grades)
