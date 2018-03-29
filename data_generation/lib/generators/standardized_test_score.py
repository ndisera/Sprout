#!/usr/bin/env python2

import datetime
import random

from lib.services.student import StudentService
from lib.services.stdtest_score import StandardizedTestScore, StandardizedTestScoreService
from lib.services.stdtest import StandardizedTest, StandardizedTestService

# https://www.schools.utah.gov/specialeducation/resources/assessment
STD_TESTS_NAMES = ["SAGE", "WIDA", "DLM", "ELAA", "UAA"]
STD_TESTS = [ StandardizedTest("SAGE", 100, 1000, 600, None, ),
              StandardizedTest("WIDA", 1, 6, None, None, ) # Note WIDA is for ELL students...
              ]

class StandardizedTestScoreGenerator():

    def __init__(self, headers=None, protocol='https', hostname="localhost", port_num=8000, verify=False):
        self.stdtest_score_service = StandardizedTestScoreService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)
        self.stdtest_service = StandardizedTestService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)
        self.student_service = StudentService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)

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
