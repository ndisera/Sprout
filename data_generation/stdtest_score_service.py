
import requests

from authorization_handler import CERT_PATH
from collections import namedtuple
import json

StandardizedTestScore = namedtuple("StandardizedTestScore", ['date', 'standardized_test', 'score', 'student', 'id'])


class StandardizedTestScoreService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.complete_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/standardized_test_scores"
        self.verify = verify

    def get_standardized_test_scores(self):
        """
        Download a complete list of standardized_test_scores

        :return: list of standardized_test_score objects
        :rtype: list[Student]
        """
        response = requests.get(self.complete_uri, verify=self.verify, headers=self.headers)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

        body = response.json()
        standardized_test_scores = body['standardized_test_scores']

        toReturn = []

        for standardized_test_score in standardized_test_scores:
            toReturn.append(StandardizedTestScore(date=standardized_test_score['date'],
                                                  standardized_test=standardized_test_score['standardized_test'],
                                                  score=standardized_test_score['score'],
                                                  student=standardized_test_score['student'],
                                                  id=standardized_test_score['id']))

        return toReturn

    def add_standardized_test_score(self, standardized_test_score):
        """
        Upload a student object to the server

        :param standardized_test_score: StandardizedTestScore object to upload
        :type standardized_test_score: StandardizedTestScore
        """
        data = standardized_test_score._asdict()
        del(data['id'])
        response = requests.post(self.complete_uri, verify=self.verify, headers=self.headers, data=data)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()

    def add_many_standardized_test_scores(self, standardized_test_scores):
        """
        Upload a list of standardized_test_score objects to the server

        :param standardized_test_scores: List of standardized_test_score objects
        :return:
        """

        data = []

        for standardized_test_score in standardized_test_scores:
            standardized_test_score = standardized_test_score._asdict()
            del(standardized_test_score['id'])
            data.append(standardized_test_score)

        data = json.dumps(data)

        headers = self.headers
        headers['content-type'] = 'application/json'

        response = requests.post(self.complete_uri, verify=self.verify, headers=headers, data=data)

        if not (response.status_code >= 200 and response.status_code < 299):
            response.raise_for_status()