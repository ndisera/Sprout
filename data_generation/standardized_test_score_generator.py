#!/usr/bin/env python2

import argparse
import datetime
import random
import requests
import sys

from authorization_handler import AuthorizationHandler
from authorization_handler import CERT_PATH

from student_service import Student, StudentService

from stdtest_score_service import StandardizedTestScore, StandardizedTestScoreService
from stdtest_service import StandardizedTest, StandardizedTestService

# https://www.schools.utah.gov/specialeducation/resources/assessment
STD_TESTS_NAMES = ["SAGE", "WIDA", "DLM", "ELAA", "UAA"]
STD_TESTS = [ StandardizedTest("SAGE", 100, 1000, None),
              StandardizedTest("WIDA", 1, 6, None) # Note WIDA is for ELL students...
              ]

class StandardizedTestScoreGenerator():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=False):
        self.stdtest_score_service = StandardizedTestScoreService(headers=headers, url=url, port_num=port_num, verify=verify)
        self.stdtest_service = StandardizedTestService(headers=headers, url=url, port_num=port_num, verify=verify)
        self.student_service = StudentService(headers=headers, url=url, port_num=port_num, verify=verify)

    def generate(self, num,
                 range_start=datetime.date(year=2018, month=01, day=12),
                 range_end=datetime.date.today()):
        """
        Generate num number of scores for each current standardized test for each student in the given date range

        :param num:
        :param range_start: Date to start random date generation
        :param range_end: Date to end random date generation
        :return:
        """

        toPost = []

        stdtests = self.stdtest_service.get_standardized_tests()
        students = self.student_service.get_students()

        for stdtest in stdtests:
            # For each test, generate some assessment dates (Not sure if this is how such tests work...)
            date_diff = range_end - range_start
            dates = []

            for count in range(0, num):
                date = range_start + datetime.timedelta(days=random.randint(0, date_diff.days))
                if date in dates:
                    count = count - 1
                    continue
                dates.append(date)

            for student in students:
                # For each student and test, randomly decide a grade range
                score_average = random.randint(stdtest.min_score, stdtest.max_score)
                score_spread = random.randint(0, stdtest.max_score / 6)

                score_max = score_average + score_spread
                score_min = score_average - score_spread

                # Don't go out of range of the test
                score_max = min(score_max, stdtest.max_score)
                score_min = max(score_min, stdtest.min_score)

                # Now generate the number of scores we were supposed to generate
                for date in dates:
                    score = random.randint(score_min, score_max)
                    score = StandardizedTestScore(date=str(date),
                                                  standardized_test=stdtest.id,
                                                  score=score,
                                                  student=student.id,
                                                  id=None)
                    toPost.append(score)

        return toPost

    def setup_tests(self):
        self.stdtest_service.add_many_standardized_tests(STD_TESTS)

    def upload(self, toPost):
        self.stdtest_score_service.add_many_standardized_test_scores(toPost)


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
    parser.add_argument("--num-scores", action="store", type=int, default=3,
                        help="number of datapoints to generate")
    parser.add_argument("--setup", action="store_true",
                        help="upload initial standardized tests as well as scores")

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

    generator = StandardizedTestScoreGenerator(url=args.url, port_num=args.port, headers=headers, verify=CERT_PATH)

    if args.setup:
        generator.setup_tests()

    toPost = generator.generate(args.num_scores)
    generator.upload(toPost)
