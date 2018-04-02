#!/usr/bin/env python2

import argparse
import datetime
import random
import requests
import sys

from lib.services.authorization import AuthorizationService
from lib.services.assignment import Assignment, AssignmentService
from lib.services.enrollment import EnrollmentService
from lib.services.grades import GradesService, Grade
from lib.services.term import TermService
from lib.services.section import SectionService

ASSIGNMENT_NAMES = ['Homework', 'Quiz', 'Worksheet', 'Lab', 'Test',]

class GradesGenerator():

    def __init__(self, headers=None, protocol='https', hostname="localhost", port_num=8000, verify=False):
        self.gradeService = GradesService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)
        self.assignmentService = AssignmentService(headers=headers, protocol=protocol, hostname=hostname, verify=verify)
        self.enrollmentService = EnrollmentService(headers=headers, protocol=protocol, hostname=hostname, verify=verify)
        self.termService = TermService(headers=headers, protocol=protocol, hostname=hostname, verify=verify)
        self.sectionService = SectionService(headers=headers, protocol=protocol, hostname=hostname, verify=verify)

    def parse_enrollments(self, enrollments):
        students = set()
        sections = set()

        for enrollment in enrollments:
            students.add(enrollment.student)
            sections.add(enrollment.section)

        return students, sections

    def generate_assignments(self, num):
        """
        Generate num number of grades for each current enrollment in the given range

        :param num: number of assignments to generate per section
        :return: Dictionary of num -> list[Assignment] where the key is the ID of the section to upload the corresponding list of assignments to
        """

        to_return = {}
        assignments = []

        terms = self.termService.get_terms()
        sections = self.sectionService.get_sections()

        # create term lookup
        term_lookup = {}
        for term in terms:
            term_lookup[term.id] = term

        for section in sections:
            term = term_lookup[section.term]
            names = set() # Keep set of generated names to avoid duplicates
            dates = set() # Avoid duplicates
            start_date = datetime.datetime.strptime(term.start_date, '%Y-%m-%d').date()
            end_date = datetime.datetime.strptime(term.end_date, '%Y-%m-%d').date()
            date_diff = end_date - start_date

            for count in range(num):
                while True: # Generate a name until we get a non-dupe
                    name = '{} {}'.format(random.choice(ASSIGNMENT_NAMES), random.randint(1, 9))
                    if not name in names:
                        break
                while True: # Generate a date until we get a non-dupe
                    date = start_date + datetime.timedelta(days=random.randint(0, date_diff.days))
                    if not date in dates:
                        break
                names.add(name)
                dates.add(date)

                # For now, all assignments are 0-100
                score_min = 0
                score_max = 100

                assignment = Assignment(section=section.id,
                                        assignment_name=name,
                                        due_date=str(date),
                                        score_min=score_min,
                                        score_max=score_max,
                                        id=None,
                                        import_id=None,
                                        )
                assignments.append(assignment)

            to_return[section.id] = assignments
            assignments = []

        return to_return


    def generate_grades(self, num):
        """
        Generate num number of grades for each current enrollment in the given range

        :param num:
        :return: Dictionary of sectionID -> Dictionary of assignmentID -> list[Grade]
        """

        to_return = {}

        enrollments = self.enrollmentService.get_enrollments()

        for enrollment in enrollments:
            section = enrollment.section
            student = enrollment.student
            to_return[enrollment.id] = {}
            to_return[enrollment.id][section] = {}

            # get the assignments for this section
            assignments = self.assignmentService.get_assignments(section=enrollment.section)

            for assignment in assignments:
                # randomly decide if it's missing
                missing_modifier = random.randint(0, 9)
                # if missing_modifier > 8:
                    # continue

                to_return[enrollment.id][section][assignment.id] = []

                duedate = datetime.datetime.strptime(assignment.due_date, '%Y-%m-%d')
                if duedate.date() > datetime.date.today():
                    continue

                grades = []

                # now generate the number of grades we were supposed to generate
                for unused in range(num):
                    # randomly decide if it was late
                    late_modifier = random.randint(0, 9)
                    handin = duedate.replace(
                                hour=datetime.datetime.now().hour, 
                                minute=datetime.datetime.now().minute, 
                                second=datetime.datetime.now().second, 
                                microsecond=datetime.datetime.now().microsecond)
                    if missing_modifier > 8:
                        handin = handin - datetime.timedelta(days=1)
                    elif late_modifier > 8:
                        handin = handin + datetime.timedelta(days=1)
                    else:
                        handin = handin - datetime.timedelta(days=1)

                    score = random.randint(assignment.score_min, assignment.score_max)
                    letter_score = ''
                    if score > 90:
                        letter_score = 'A'
                    elif score > 80:
                        letter_score = 'B'
                    elif score > 70:
                        letter_score = 'C'
                    elif score > 60:
                        letter_score = 'D'
                    else:
                        letter_score = 'I'

                    grade = Grade(assignment=assignment.id,
                                  score=score,
                                  student=student,
                                  handin_datetime=str(handin),
                                  late=(late_modifier > 8 and missing_modifier <= 8),
                                  missing=(missing_modifier > 8),
                                  grade=letter_score,
                                  id=None)
                    grades.append(grade)

                to_return[enrollment.id][section][assignment.id] = grades

        return to_return


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload random grade information to Sprout")
    parser.add_argument("--protocol", action='store', default='https', type=str,
                        help="protocol to use (default: https)")
    parser.add_argument("--hostname", "-u", action='store', default="localhost", type=str,
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
                        help="number of datapoints to generate for each assignment")
    parser.add_argument("--setup-num-assign", action="store", type=int,
                        help="generate and upload this number of assignments")

    args = parser.parse_args()

    if not args.token:
        args.username, args.password = AuthorizationService.display_login_prompt(args.username, args.password)

        authorizationHandler = AuthorizationService(protocol=args.protocol,
                                                    hostname=args.hostname,
                                                    port_num=args.port,
                                                    verify=False)

        try:
            args.token = authorizationHandler.send_login_request(args.username, args.password)
        except requests.exceptions.HTTPError as err:
            print "Unable to send login request:"
            print err
            sys.exit(1)

    headers = { 'Authorization': 'JWT {}'.format(args.token)}

    generator = GradesGenerator(protocol=args.protocol, hostname=args.hostname, port_num=args.port, headers=headers, verify=False)

    if args.setup_num_assign is not None:
        assignments = generator.generate_assignments(args.setup_num_assign)

        for sectionID in assignments.keys():
            generator.assignmentService.add_many_assignments(assignments[sectionID], section=sectionID)
    else:
        grades = generator.generate_grades(args.num_scores)

        for enrollment in grades.keys():
            for section in grades[enrollment].keys():
                for assignment in grades[enrollment][section].keys():
                    if len(grades[enrollment][section][assignment]) == 0:
                        continue

                    generator.gradeService.add_many_grades(grades[enrollment][section][assignment],
                                                           section=section,
                                                           assignment=assignment)
