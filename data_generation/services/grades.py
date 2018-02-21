
import json
import requests

from authorization import CERT_PATH
from collections import namedtuple

Grade = namedtuple("Grade", ['assignment', 'student', 'score', 'handin_datetime', 'id'])


class GradesService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.uri_template_sections = "https://" + str(self.url) + ":" + str(self.port_num) + "/sections/{sections_pk}/assignments/{assignments_pk}/grades"
        self.uri_template_students = "https://" + str(self.url) + ":" + str(self.port_num) + "/students/{students_pk}/grades/"
        self.verify = verify

    def get_grades(self, section=None, assignment=None, student=None):
        """
        Download a complete list of grades either:
            for the specified assignment in the specified section
            for the specified student

        Either student or both section and assignment must be defined

        :return: list of grade objects
        :param section: ID of the section to which the assignment belongs
        :type section: num
        :param assignment: ID of the assignment to fetch grades for
        :type assignment: num
        :param student: ID of the student to fetch grades for
        :rtype: list[Grade]
        """

        if student is not None:
            complete_uri = self.uri_template_students.format(students_pk=student)
        elif section is not None and assignment is not None:
            complete_uri = self.uri_template_sections.format(sections_pk=section, assignments_pk=assignment)
        else:
            raise TypeError("get_grades must be called with either a studentID or both sectionID and assignmentID")

        return self._get_grades(uri=complete_uri)

    def _get_grades(self, uri):
        """
        Get grades using the endpoint specified in uri

        :param uri: complete URI to send a get request to
        :return: list[Grade]
        """
        response = requests.get(uri, verify=self.verify, headers=self.headers)

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

    def add_grade(self, grade, section=None, assignment=None, student=None):
        """
        Upload a grade object to the server under the specified assignment under the specified section

        :param grade: Grade object to upload
        :param section: ID of the section to which the assignment belongs
        :type section: num
        :param assignment: ID of the assignment to which the grade belongs
        :type assignment: num
        :param student: ID of the student to whom the grade belongs
        :type student: num
        :type grade: Grade
        """
        return self.add_many_grades([grade], section=section, assignment=assignment, student=student)

    def add_many_grades(self, grades, section=None, assignment=None, student=None ):
        """
        Upload a list of grade objects to the server under the specified assignment under the specified section

        :param grades: List of grade objects
        :param section: ID of the section to which the assignment belongs
        :type section: num
        :param assignment: ID of the assignment to which the grades belong
        :type assignment: num
        :param student: ID of the student to whom the grades belong
        :type student: num
        :return:
        """

        if student is not None:
            complete_uri = self.uri_template_students.format(students_pk=student)
        elif section is not None and assignment is not None:
            complete_uri = self.uri_template_sections.format(sections_pk=section, assignments_pk=assignment)
        else:
            raise TypeError("add_many_grades must be called with either a studentID or both sectionID and assignmentID")

        return self._add_many_grades(grades=grades, uri=complete_uri)

    def _add_many_grades(self, grades, uri):
        data = []

        for grade in grades:
            grade = grade._asdict()
            del(grade['id'])
            data.append(grade)

        data = json.dumps(data)

        headers = self.headers
        headers['content-type'] = 'application/json'

        response = requests.post(uri, verify=self.verify, headers=headers, data=data)

        response.raise_for_status()

        return response
