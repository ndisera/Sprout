
import requests

from authorization_handler import CERT_PATH
from collections import namedtuple

Enrollment = namedtuple("Enrollment", ['section', 'student', 'id'])


class EnrollmentService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.complete_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/enrollments/"
        self.verify = verify

    def get_enrollments(self):
        """
        Download a complete list of enrollments

        :return: list of enrollment objects
        :rtype: list[Enrollment]
        """
        response = requests.get(self.complete_uri, verify=self.verify, headers=self.headers)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

        body = response.json()
        enrollments = body['enrollments']

        toReturn = []

        for enrollment in enrollments:
            toReturn.append(Enrollment(section=enrollment['section'],
                                       student=enrollment['student'],
                                       id=enrollment['id']))

        return toReturn

    def add_enrollment(self, enrollment):
        """
        Upload a enrollment object to the server

        :param enrollment: Enrollment object to upload
        :type enrollment: Enrollment
        """
        data = enrollment._asdict()
        del(data['id'])
        response = requests.post(self.complete_uri, verify=self.verify, headers=self.headers, data=data)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()