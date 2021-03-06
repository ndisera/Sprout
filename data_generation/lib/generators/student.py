#!/usr/bin/env python2

import datetime
import os
import random

from lib.services.student import Student, StudentService
from lib.services.users import UsersService


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
                                      first_names_file="first_names.txt",
                                      last_names_file="last_names.txt",
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

                    # Generate a random grade level
                    random_grade_level = random.randint(7, 8)

                    case_manager = random.choice(case_manager_ids)
                    student = Student(
                        student_id=student_id,
                        first_name=first_name,
                        last_name=last_name,
                        birthdate=str(datetime.date(year=birthdate.year, month=birthdate.month, day=birthdate.day)),
                        created=None,
                        case_manager=case_manager,
                        picture=None,
                        grade_level=random_grade_level,
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
