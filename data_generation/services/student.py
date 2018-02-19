
import json
import requests

from authorization import CERT_PATH
from collections import namedtuple

Student = namedtuple("Student", ['student_id', 'first_name', 'last_name', 'birthdate', 'case_manager', 'id'])


class StudentService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.complete_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/students/"
        self.verify = verify

    def get_students(self):
        """
        Download a complete list of students

        :return: list of student objects
        :rtype: list[Student]
        """
        response = requests.get(self.complete_uri, verify=self.verify, headers=self.headers)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

        body = response.json()
        students = body['students']

        toReturn = []

        for student in students:
            toReturn.append(Student(**student))

        return toReturn

    def add_student(self, student):
        """
        Upload a student object to the server

        :param student: Student object to upload
        :type student: Student
        """
        data = student._asdict()
        del(data['id'])
        response = requests.post(self.complete_uri, verify=self.verify, headers=self.headers, data=data)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

        return response

    def add_many_students(self, students):
        """
        Upload a list of student objects to the server

        :param students: List of student objects
        :return:
        """

        data = []

        for student in students:
            student = student._asdict()
            del(student['id'])
            data.append(student)

        data = json.dumps(data)

        headers = self.headers
        headers['content-type'] = 'application/json'

        response = requests.post(self.complete_uri, verify=self.verify, headers=headers, data=data)

        response.raise_for_status()

        return response