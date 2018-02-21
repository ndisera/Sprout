
import json
import requests

from authorization import CERT_PATH
from collections import namedtuple

Term = namedtuple("Term", ['name', 'start_date', 'end_date', 'id'])


class TermService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.complete_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/terms/"
        self.verify = verify

    def get_terms(self):
        """
        Download a complete list of terms

        :return: list of term objects
        :rtype: list[Terms]
        """
        response = requests.get(self.complete_uri, verify=self.verify, headers=self.headers)

        response.raise_for_status()

        body = response.json()
        terms = body['terms']

        toReturn = []

        for term in terms:
            toReturn.append(Term(**term))

        return toReturn

    def add_term(self, term):
        """
        Upload a term object to the server

        :param term: Term object to upload
        :type term: Term
        """
        return self.add_many_terms(terms=[term])

    def add_many_terms(self, terms):
        """
        Upload a list of term objects to the server

        :param terms: List of term objects
        :return:
        """

        data = []

        for term in terms:
            term = term._asdict()
            del(term['id'])
            data.append(term)

        data = json.dumps(data)

        headers = self.headers
        headers['content-type'] = 'application/json'

        response = requests.post(self.complete_uri, verify=self.verify, headers=headers, data=data)

        response.raise_for_status()

        return response
