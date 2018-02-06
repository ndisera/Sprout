#!/usr/bin/env python2

import argparse
import datetime
import random
import requests
import sys

from authorization_handler import AuthorizationHandler
from authorization_handler import CERT_PATH

from enrollment_service import Enrollment, EnrollmentService

from grades_service import GradesService, Grade

ASSIGNMENT_NAMES = ['Homework',  'Quiz', 'Worksheet']

class GradesGenerator():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=False):
        self.gradeService = GradesService(headers=headers, url=url, port_num=port_num, verify=verify)
        self.enrollmentService = EnrollmentService(headers=headers, url=url, port_num=port_num, verify=verify)

    def parse_enrollments(self, enrollments):
        students = set()
        sections = set()

        for enrollment in enrollments:
            students.add(enrollment.student)
            sections.add(enrollment.section)

        return students, sections

    def generate(self, num,
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

        enrollments = self.enrollmentService.get_enrollments()
        (students, sections) = self.parse_enrollments(enrollments)

        for section in sections:
            # For each section, generate a list of assignment names and due dates
            names = []
            dates = []
            date_diff = range_end - range_start

            for count in range(0, num):
                while True:
                    name = '{} {}'.format(random.choice(ASSIGNMENT_NAMES), random.randint(1, 9))
                    if not name in names:
                        break
                date = range_start + datetime.timedelta(days=random.randint(0, date_diff.days))
                names.append(name)
                dates.append(date)

            for student in students:
                # Find the original enrollment (if it exists)
                enrollment = None
                for e in enrollments:
                    if e.student is student and e.section is section:
                        enrollment = e
                        break
                if enrollment is None:
                    continue

                # For each student and section, randomly decide a grade range
                grade_average = random.randint(0, 100)
                grade_spread = random.randint(0, 15)

                grade_max = grade_average + grade_spread
                if grade_max > 100:
                    grade_max = 100

                grade_min = grade_average - grade_spread
                if grade_min < 0:
                    grade_min = 0

                # Now generate the number of grades we were supposed to generate
                for name, date in zip(names, dates):
                    score = random.randint(grade_min, grade_max)
                    grade = Grade(due_date=str(date),
                                  enrollment=enrollment.id,
                                  percent=score,
                                  assignment_name=name,
                                  id=None)
                    toPost.append(grade)

        return toPost

    def upload(self, toPost):
        self.gradeService.add_many_grades(toPost)


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

    args = parser.parse_args()

    if not args.token:
        args.username, args.password = AuthorizationHandler.display_login_prompt(args.username, args.password)

        authorizationHandler = AuthorizationHandler(url="https://{}".format(args.url),
                                                    port_num=args.port,
                                                    verify=CERT_PATH)

        try:
            args.token = authorizationHandler.send_login_request(args.username, args.password)
        except requests.exceptions.HTTPError as err:
            print "Unable to send login request:"
            print err
            sys.exit(1)

    headers = { 'Authorization': 'JWT {}'.format(args.token)}

    generator = GradesGenerator(url=args.url, port_num=args.port, headers=headers, verify=CERT_PATH)

    toPost = generator.generate(args.num_scores)
    generator.upload(toPost)
