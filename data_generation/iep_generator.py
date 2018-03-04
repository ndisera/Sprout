#!/usr/bin/env python2

import argparse
import datetime
import os
import random
import requests
import sys

from services.authorization import AuthorizationService

from services.student import Student, StudentService

from services.ieps import IEPGoal, IEPService

class IEPGenerator(object):
    """IEPGenerator contains various methods for generating IEP data

    This uses the Sprout Backend API. As such, the backend needs to be running before these
    scripts can do anything
    """

    CERT_PATH = os.path.dirname(os.path.realpath(__file__))

    GOAL_TITLE_PREFIXES = ["Improve",
                           "Work on",
                           "Watch",
                           ]
    GOAL_TITLE_CATEGORIES = ["behavior",
                             "effort",
                             "test scores",
                             "grades",
                             ]
    GOAL_TITLE_SUFFIXES = ["",
                           "in math class",
                           "in science class",
                           "on Thursdays",
                           "on Mondays",
                           "before lunch",
                           "after lunch",
                           "in the morning"
                           ]

    def __init__(self, headers=None, protocol='https', hostname="localhost", port_num=8000, verify=False):
        self.studentService = StudentService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)
        self.iepService = IEPService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)

    def generate_many_random_iep_goals(self,
                                       num,
                                       quantitative_chance = 0.5,
                                       duedate_range_start=datetime.datetime.now() + datetime.timedelta(days=365),
                                       duedate_range_end=datetime.datetime.now() + datetime.timedelta(days=730)):
        """
        Generate the specified number of IEPGoals for each student in the database

        :param num: Number of IEP Goals to generate for each student
        :param quantitative_chance: Chance that a goal will be quantitative
        :param duedate_range_start:
        :param duedate_range_end:
        :return: Dictionary of student_id -> List of IEPGoals
        """
        to_return = {}

        student_ids = [student.id for student in self.studentService.get_students()]

        for student_id in student_ids:
            iep_goals = []
            for i in range(num):
                # Generate a randomly assembled title
                title = "{prefix} {category} {suffix}".format(
                    prefix=random.choice(self.GOAL_TITLE_PREFIXES),
                    category=random.choice(self.GOAL_TITLE_CATEGORIES),
                    suffix=random.choice(self.GOAL_TITLE_SUFFIXES),
                )

                # Generate a random due date
                date_range_size = duedate_range_end - duedate_range_start
                random_day_delta = random.randint(0, date_range_size.days)
                due_date = duedate_range_start + datetime.timedelta(days=random_day_delta)
                due_date = due_date.date()

                # Decide whether this goal shall be quantitative
                quantitative = random.random() < quantitative_chance
                quantitative_range_low = None
                quantitative_range_upper = None
                quantitative_category = None # Never actually used at the moment
                if quantitative:
                    quantitative_range_low = 0
                    quantitative_range_upper = random.choice([25, 50, 75, 100])

                goal = IEPGoal(
                    title=title,
                    due_date=str(due_date),
                    student=student_id,
                    quantitative=quantitative,
                    quantitative_range_low=quantitative_range_low,
                    quantitative_range_upper=quantitative_range_upper,
                    quantitative_category=quantitative_category,
                )
                iep_goals.append(goal)
            to_return[student_id] = iep_goals
        return to_return
