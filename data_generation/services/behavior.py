
import json
import requests

from authorization import CERT_PATH
from collections import namedtuple

Behavior = namedtuple("Behavior", ['date', 'enrollment', 'behavior', 'effort', 'id', ])


class BehaviorService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.complete_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/behaviors/"
        self.verify = verify

    def get_behaviors(self):
        """
        Download a complete list of behaviors

        :return: list of behavior objects
        :rtype: list[Behavior]
        """
        response = requests.get(self.complete_uri, verify=self.verify, headers=self.headers)

        response.raise_for_status()

        body = response.json()
        behaviors = body['behaviors']

        toReturn = []

        for behavior in behaviors:
            toReturn.append(Behavior(**behavior))

        return toReturn

    def add_behavior(self, behavior):
        """
        Upload a behavior object to the server

        :param behavior: Behavior object to upload
        :type behavior: Behavior
        """
        data = behavior._asdict()
        del(data['id'])
        response = requests.post(self.complete_uri, verify=self.verify, headers=self.headers, data=data)

        response.raise_for_status()

        return response

    def add_many_behaviors(self, behaviors):
        """
        Upload a list of behavior objects to the server

        :param behaviors: List of behavior objects
        :return:
        """

        data = []

        for behavior in behaviors:
            behavior = behavior._asdict()
            del(behavior['id'])
            data.append(behavior)

        data = json.dumps(data)

        headers = self.headers
        headers['content-type'] = 'application/json'

        response = requests.post(self.complete_uri, verify=self.verify, headers=headers, data=data)

        response.raise_for_status()

        return response
