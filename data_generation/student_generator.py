#!/usr/bin/env python2

import argparse
import datetime
import getpass
import os
import random
import requests
import sys

from authorization_handler import AuthorizationHandler

CERT_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../pki/rootCA_cert.pem")
headers = { }

class StudentGenerator(object):
    """StudentGenerator contains various methods for generating student data

    This uses the Sprout BackEnd API. As such, the BackEnd needs to be running before these
    scripts can do anything
    """

    RANDOM_STUDENT_ID_PREFIX = "gen"
    CERT_PATH = os.path.dirname(os.path.realpath(__file__))

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=False):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.complete_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/students/"
        self.verify = verify

    def upload_many_random_students(self,
                                    num_students,
                                    first_names_file="./first_names.txt",
                                    last_names_file="./last_names.txt",
                                    birthdate_range_start=datetime.date(2006, 9, 1),
                                    birthdate_range_end=datetime.date(2008, 9, 1)):
        """Upload a specified number of students by reading first and last names from text files

        :param num_students: Number of students to upload
        :type num_students: int
        :param first_names_file:
        :param last_names_file:
        :param birthdate_range_start:
        :type birthdate_range_start: datetime.date
        :param birthdate_range_end:
        :type birthdate_range_end: datetime.date
        :return: void
        """
        with open(first_names_file, 'r') as first_names_file:
            with open(last_names_file, 'r') as last_names_file:
                first_names = first_names_file.read()
                first_names = first_names.split()
                last_names = last_names_file.read()
                last_names = last_names.split()

                for i in range(0, num_students):
                    self.upload_random_student(first_names,
                                               last_names,
                                               birthdate_range_start,
                                               birthdate_range_end)

    def upload_random_student(self,
                              first_names,
                              last_names,
                              birthdate_range_start=datetime.date(2006, 9, 1),
                              birthdate_range_end=datetime.date(2008, 9, 1)):
        """Generate and upload a random student based on the passed parameters

        :param first_names: List from which to select first names
        :type first_names: list of strings
        :param last_names: List from which to select last names
        :type last_names: list of strings
        :param birthdate_range_start:
        :type birthdate_range_start: datetime.date
        :param birthdate_range_end:
        :type birthdate_range_end: datetime.date
        :return: void
        """
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

        self.upload_student(student_id, first_name, last_name, birthdate)

    def upload_developer_information(self):
        self.upload_student(student_id="dev960520",
                            first_name="Nico",
                            last_name="DiSera",
                            birthdate=datetime.date(year=1996, month=5, day=20))

        self.upload_student(student_id="dev950118",
                            first_name="Simon",
                            last_name="Redman",
                            birthdate=datetime.date(year=1995, month=1, day=18))

        self.upload_student(student_id="dev520807",
                            first_name="Guy",
                            last_name="Watson",
                            birthdate=datetime.date(year=1752, month=8, day=7))

        self.upload_student(student_id="dev890918",
                            first_name="Graham",
                            last_name="Zuber",
                            birthdate=datetime.date(year=1989, month=9, day=18))

    def upload_student(self, student_id, first_name, last_name, birthdate):
        """Upload a single student to the server

        :param student_id: The unique identifier for this student
        :type student_id: str
        :param first_name: First name of the student
        :type first_name: str
        :param last_name: Last name of the student
        :type last_name: str
        :param birthdate: Student's birthday
        :type birthdate: datetime.date
        :return:
        """
        json = {"student_id": student_id,
                "first_name":first_name,
                "last_name":last_name,
                "birthdate":str(birthdate)}
        response = requests.post(url=self.complete_uri, json=json, verify=self.verify, headers=self.headers)
        print response.json()

        if not (response.status_code >= 200 and response.status_code < 300):
            response.raise_for_status()

def post_request(self, url, data):
    response = requests.post(url=url, json=data, verify=self.verify, headers=headers)
    if response.status_code > 299:
        print 'oh, crap... something went wrong. error code ' + str(response.status_code) + ' when I posted ' + url + ' with payload: ' + str(data)
        print 'response data: ' + str(response.json())
        sys.exit()
    return response


@staticmethod
def upload_basic_bitches():
    # teachers
    host = 'localhost'
    port = 8000
    base_url = 'https://' + host + ':' + str(port) + '/'
    teacher_url = base_url + 'teachers/'

    teacher_matt = {
        'username': 'mflatt',
        'first_name': 'Matthew',
        'last_name': 'Flatt',
        'email': 'mflatt@totallyrealemail.edu',
    }

    teacher_danny = {
        'username': 'dkopta',
        'first_name': 'Daniel',
        'last_name': 'Kopta',
        'email': 'dkopta@totallyrealemail.edu',
    }

    response = post_request(url=teacher_url, data=teacher_matt)
    teacher_matt_id = response.json()['teacher']['id']

    response = post_request(url=teacher_url, data=teacher_danny)
    teacher_danny_id = response.json()['teacher']['id']

    # students
    student_url = base_url + 'students/'

    generator = StudentGenerator(headers=headers)
    generator.upload_developer_information()

    students = requests.get(url=student_url, verify=self.verify, headers=headers).json()['students']

    # sections
    section_url = base_url + 'sections/'

    section_matt = {
        'teacher': teacher_matt_id,
        'title': 'CS 5510',
    }

    section_danny = {
        'teacher': teacher_danny_id,
        'title': 'CS 4400',
    }

    response = post_request(url=section_url, data=section_matt)
    section_matt_id = response.json()['section']['id']
    response = post_request(url=section_url, data=section_danny)
    section_danny_id = response.json()['section']['id']

    # enrollments
    enrollment_url = base_url + 'enrollments/'

    enrollments = []
    for student in students:
        enrollments.append({'section': section_matt_id, 'student': student['id']})
        enrollments.append({'section': section_danny_id, 'student': student['id']})

    enrollments_posted = []
    for enrollment in enrollments:
        response = post_request(url=enrollment_url, data=enrollment)
        enrollments_posted.append(response.json()['enrollment'])

    # behaviors
    behaviors_url = base_url + 'behaviors/'

    current_date = datetime.date.today()
    for day in range(1, 32):
        for enrollment in enrollments_posted:
            to_post = {
                'date': '2017-' + current_date.strftime('%m') + '-' + str(day),
                'enrollment': enrollment['id'],
                'effort': random.randint(1, 5),
                'behavior': random.randint(1, 5),
            }
            response = post_request(url=behaviors_url, data=to_post)


if __name__ == "__main__":
    options = {
        '--setup': upload_basic_bitches,
    }

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
    parser.add_argument("--setup", action="store_const", default=False, const=True,
                        help="prerelease setup script")

    args = parser.parse_args()

    if not args.token:
        if not args.username:
            args.username = raw_input("Sprout Username: ")
        if not args.password:
            args.password = getpass.getpass("Sprout Password for {}: ".format(args.username))

        authorizationHandler = AuthorizationHandler(url="https://{}".format(args.url),
                                                    port_num=args.port,
                                                    verify=CERT_PATH)

        try:
            args.token = authorizationHandler.send_login_request(args.username, args.password)
        except requests.exceptions.HTTPError as err:
            print "Unable to send login request:"
            print err
            sys.exit(1)

    headers['Authorization'] = 'JWT ' + args.token

    if args.setup:
        upload_basic_bitches()
    else:
        generator = StudentGenerator(url=args.url, verify=CERT_PATH, headers=headers)
        # generator.upload_developer_information();
        generator.upload_many_random_students(5)




