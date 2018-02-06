
import json
import requests

from authorization_service import CERT_PATH
from collections import namedtuple

Assignment = namedtuple("Assignment", ['section', 'assignment_name', 'score_min', 'score_max', 'due_date', 'id'])


class AssignmentService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.complete_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/assignments/"
        self.verify = verify

    def get_assignments(self):
        """
        Download a complete list of assignments

        :return: list of assignment objects
        :rtype: list[Assignment]
        """
        response = requests.get(self.complete_uri, verify=self.verify, headers=self.headers)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

        body = response.json()
        assignments = body['assignments']

        toReturn = []

        for assignment in assignments:
            toReturn.append(Assignment(section=assignment['section'],
                                       assignment_name=assignment['assignment_name'],
                                       score_min=assignment['score_min'],
                                       score_max=assignment['score_max'],
                                       due_date=assignment['due_date'],
                                       id=assignment['id']))

        return toReturn

    def add_assignment(self, assignment):
        """
        Upload a grade object to the server

        :param assignment: Grade object to upload
        :type assignment: Grade
        """
        data = assignment._asdict()
        del(data['id'])
        response = requests.post(self.complete_uri, verify=self.verify, headers=self.headers, data=data)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

    def add_many_assignments(self, assignments):
        """
        Upload a list of assignment objects to the server

        :param assignments: List of grade objects
        :return:
        """

        data = []

        for assignment in assignments:
            assignment = assignment._asdict()
            del(assignment['id'])
            data.append(assignment)

        data = json.dumps(data)

        headers = self.headers
        headers['content-type'] = 'application/json'

        response = requests.post(self.complete_uri, verify=self.verify, headers=headers, data=data)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()
