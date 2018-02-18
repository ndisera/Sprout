
import requests

from authorization_service import CERT_PATH
from collections import namedtuple
import json

StandardizedTest = namedtuple("StandardizedTest", ['test_name', 'min_score', 'max_score', 'id'])


class StandardizedTestService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.complete_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/tests/standardized"
        self.verify = verify

    def get_standardized_tests(self):
        """
        Download a complete list of standardized_tests

        :return: list of standardized_test objects
        :rtype: list[Student]
        """
        response = requests.get(self.complete_uri, verify=self.verify, headers=self.headers)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

        body = response.json()
        standardized_tests = body['standardized_tests']

        toReturn = []

        for standardized_test in standardized_tests:
            toReturn.append(StandardizedTest(test_name=standardized_test['test_name'],
                                             min_score=standardized_test['min_score'],
                                             max_score=standardized_test['max_score'],
                                             id=standardized_test['id']))

        return toReturn

    def add_standardized_test(self, standardized_test):
        """
        Upload a student object to the server

        :param standardized_test: StandardizedTest object to upload
        :type standardized_test: StandardizedTest
        """
        data = standardized_test._asdict()
        del(data['id'])
        response = requests.post(self.complete_uri, verify=self.verify, headers=self.headers, data=data)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

    def add_many_standardized_tests(self, standardized_tests):
        """
        Upload a list of standardized_test objects to the server

        :param standardized_tests: List of standardized_test objects
        :return:
        """

        data = []

        for standardized_test in standardized_tests:
            standardized_test = standardized_test._asdict()
            del(standardized_test['id'])
            data.append(standardized_test)

        data = json.dumps(data)

        headers = self.headers
        headers['content-type'] = 'application/json'

        response = requests.post(self.complete_uri, verify=self.verify, headers=headers, data=data)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()