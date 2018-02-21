
import json
import requests

from authorization import CERT_PATH
from collections import namedtuple

Assignment = namedtuple("Assignment", ['section', 'assignment_name', 'score_min', 'score_max', 'due_date', 'id'])


class AssignmentService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.uri_template = "https://" + str(self.url) + ":" + str(self.port_num) + "/sections/{sections_pk}/assignments/"
        self.verify = verify

    def get_assignments(self, section):
        """
        Download a complete list of assignments for a specified section

        :param section: ID of the section to consider
        :type section: num
        :return: list of assignment objects
        :rtype: list[Assignment]
        """
        complete_uri = self.uri_template.format(sections_pk=section)
        response = requests.get(complete_uri, verify=self.verify, headers=self.headers)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

        body = response.json()
        assignments = body['assignments']

        toReturn = []

        for assignment in assignments:
            toReturn.append(Assignment(**assignment))

        return toReturn

    def add_assignment(self, assignment, section):
        """
        Upload an assignment object to the server under the specified section

        :param assignment: Assignment object to upload
        :type assignment: Assignment
        :param section: ID of the section to post these assignments to
        :type section: num
        """
        return self.add_many_assignments(assignments=[assignment], section=section)

    def add_many_assignments(self, assignments, section):
        """
        Upload a list of assignment objects to the server under the specified section

        :param assignments: List of assignment objects
        :type assignment: Assignment
        :param section: ID of the section to post these assignments to
        :type section: num
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

        complete_uri = self.uri_template.format(sections_pk=section)

        response = requests.post(complete_uri, verify=self.verify, headers=headers, data=data)

        response.raise_for_status()

        return response
