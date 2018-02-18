
import json
import requests

from authorization_service import CERT_PATH
from collections import namedtuple

Section = namedtuple("Section", ['teacher', 'title', 'id', ])


class SectionService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.complete_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/sections/"
        self.verify = verify

    def get_sections(self):
        """
        Download a complete list of sections

        :return: list of section objects
        :rtype: list[Section]
        """
        response = requests.get(self.complete_uri, verify=self.verify, headers=self.headers)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

        body = response.json()
        sections = body['sections']

        toReturn = []

        for section in sections:
            toReturn.append(Section(**section))

        return toReturn

    def add_section(self, section):
        """
        Upload a section object to the server

        :param section: Section object to upload
        :type section: Section
        """
        data = section._asdict()
        del(data['id'])
        response = requests.post(self.complete_uri, verify=self.verify, headers=self.headers, data=data)

        response.raise_for_status()

        return response

    def add_many_sections(self, sections):
        """
        Upload a list of section objects to the server

        :param sections: List of section objects
        :return:
        """

        data = []

        for section in sections:
            section = section._asdict()
            del(section['id'])
            data.append(section)

        data = json.dumps(data)

        headers = self.headers
        headers['content-type'] = 'application/json'

        response = requests.post(self.complete_uri, verify=self.verify, headers=headers, data=data)

        response.raise_for_status()

        return response
