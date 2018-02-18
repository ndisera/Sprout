
import json
import requests

from authorization_service import CERT_PATH
from collections import namedtuple

Grade = namedtuple("Grade", ['assignment', 'student', 'score', 'handin_datetime', 'id'])


class GradesService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.complete_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/grades/"
        self.verify = verify

    def get_grades(self):
        """
        Download a complete list of grades

        :return: list of grade objects
        :rtype: list[Grade]
        """
        response = requests.get(self.complete_uri, verify=self.verify, headers=self.headers)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

        body = response.json()
        grades = body['grades']

        toReturn = []

        for grade in grades:
            toReturn.append(Grade(assignment=grade['assignment'],
                                  student=grade['student'],
                                  score=grade['score'],
                                  handin_datetime=grade['handin_datetime'],
                                  id=grade['id']))

        return toReturn

    def add_grade(self, grade):
        """
        Upload a grade object to the server

        :param grade: Grade object to upload
        :type grade: Grade
        """
        data = grade._asdict()
        del(data['id'])
        response = requests.post(self.complete_uri, verify=self.verify, headers=self.headers, data=data)

        response.raise_for_status()

        return response

    def add_many_grades(self, grades):
        """
        Upload a list of grade objects to the server

        :param grades: List of grade objects
        :return:
        """

        data = []

        for grade in grades:
            grade = grade._asdict()
            del(grade['id'])
            data.append(grade)

        data = json.dumps(data)

        headers = self.headers
        headers['content-type'] = 'application/json'

        response = requests.post(self.complete_uri, verify=self.verify, headers=headers, data=data)

        response.raise_for_status()

        return response
