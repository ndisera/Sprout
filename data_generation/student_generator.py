#!/usr/bin/env python2

import argparse
import datetime
import os
import random
import requests
import sys

from services.authorization import AuthorizationService

from services.student import Student, StudentService

from services.users import User, UsersService

class StudentGenerator(object):
    """StudentGenerator contains various methods for generating student data

    This uses the Sprout BackEnd API. As such, the BackEnd needs to be running before these
    scripts can do anything
    """

    RANDOM_STUDENT_ID_PREFIX = "gen"
    CERT_PATH = os.path.dirname(os.path.realpath(__file__))

    def __init__(self, headers=None, protocol='https', hostname="localhost", port_num=8000, verify=False):
        self.studentService = StudentService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)
        self.usersService = UsersService(headers=headers, protocol=protocol, hostname=hostname, verify=verify)

    def generate_many_random_students(self,
                                      num_students,
                                      case_manager_ids,
                                      first_names_file="services/first_names.txt",
                                      last_names_file="services/last_names.txt",
                                      birthdate_range_start=datetime.date(2006, 9, 1),
                                      birthdate_range_end=datetime.date(2008, 9, 1)):
        """Generate a specified number of students by reading first and last names from text files

        :param num_students: Number of students to upload
        :type num_students: int
        :param first_names_file:
        :param last_names_file:
        :param birthdate_range_start:
        :type birthdate_range_start: datetime.date
        :param birthdate_range_end:
        :type birthdate_range_end: datetime.date
        :return: list[Student]
        """
        files_path = os.path.dirname(os.path.abspath(__file__))
        first_names_file = os.path.join(files_path, first_names_file)
        last_names_file = os.path.join(files_path, last_names_file)
        students = []

        # Get the list of possible user IDs to use for case managers
        # case_managers = [user.id for user in self.usersService.get_users()]

        with open(first_names_file, 'r') as first_names_file:
            with open(last_names_file, 'r') as last_names_file:
                first_names = first_names_file.read()
                first_names = first_names.split()
                last_names = last_names_file.read()
                last_names = last_names.split()

                for i in range(0, num_students):
                    first_name = random.choice(first_names)
                    last_name = random.choice(last_names)

                    # Generate a random birthday
                    date_range_size = birthdate_range_end - birthdate_range_start
                    random_date_delta = random.randint(0, date_range_size.days)
                    birthdate = birthdate_range_start + datetime.timedelta(random_date_delta)

                    # Generate a random student id
                    random_id_number = random.randrange(100000, 999999)
                    # If that number turns out to be non-unique, we will be in trouble. Cross your fingers!
                    student_id = str(StudentGenerator.RANDOM_STUDENT_ID_PREFIX + str(random_id_number))

                    case_manager = random.choice(case_manager_ids)
                    student = Student(
                        student_id=student_id,
                        first_name=first_name,
                        last_name=last_name,
                        birthdate=str(datetime.date(year=birthdate.year, month=birthdate.month, day=birthdate.day)),
                        created=None,
                        case_manager=case_manager,
                        picture=None,
                        id=None,
                    )
                    students.append(student)
        return students

    @staticmethod
    def generate_developer_students(case_manager_ids):
        """
        Generate and upload students named after the original Sprout developers
        :param case_manager_ids: list of valid IDs for case managers
        :return:
        """
        student_nico = Student(student_id="dev960520",
                               first_name="Nico",
                               last_name="DiSera",
                               birthdate=str(datetime.date(year=1996, month=5, day=20)),
                               case_manager=random.choice(case_manager_ids),
                               id=None,
                               )

        student_simon = Student(student_id="dev950118",
                                first_name="Simon",
                                last_name="Redman",
                                birthdate=str(datetime.date(year=1995, month=1, day=18)),
                                case_manager=random.choice(case_manager_ids),
                                id=None,
                                )

        student_guy = Student(student_id="dev520807",
                              first_name="Guy",
                              last_name="Watson",
                              birthdate=str(datetime.date(year=1752, month=8, day=7)),
                              case_manager=random.choice(case_manager_ids),
                              id=None,
                              )

        student_graham = Student(student_id="dev890918",
                                 first_name="Graham",
                                 last_name="Zuber",
                                 birthdate=str(datetime.date(year=1989, month=9, day=18)),
                                 case_manager=random.choice(case_manager_ids),
                                 id=None,
                                 )

        return (student_nico, student_simon, student_guy, student_graham)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload students and relevant information to Sprout")
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

    headers['Authorization'] = 'JWT ' + args.token

    generator = StudentGenerator(url=args.url, verify=False, headers=headers)

    students = generator.generate_many_random_students(5)
    generator.studentService.add_many_students(students)
