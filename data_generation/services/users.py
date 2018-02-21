
import json
import requests

from authorization import CERT_PATH
from collections import namedtuple

User = namedtuple("User", ['id', 'email', 'first_name', 'last_name'])


class UsersService():

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=CERT_PATH):
        self.headers = headers
        self.url = url
        self.port_num = port_num
        self.complete_list_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/users/"
        self.complete_register_uri = "https://" + str(self.url) + ":" + str(self.port_num) + "/registration/"
        self.verify = verify

    def get_users(self):
        """
        Download a complete list of users

        :return: list of user objects
        :rtype: list[User]
        """
        response = requests.get(self.complete_list_uri, verify=self.verify, headers=self.headers)

        response.raise_for_status()

        body = response.json()
        users = body['sprout_users']

        toReturn = []

        for user in users:
            toReturn.append(User(**user))

        return toReturn

    def register_user(self, user, password=None):
        """
        Register a user, optionally with a password

        :param user: User object to register
        :param password:
        :return:
        """
        data = user._asdict()
        del data['id']
        if password is not None:
            data['password1'] = password
            data['password2'] = password
        response = requests.post(self.complete_register_uri, data=data, verify=self.verify, headers=self.headers)
        response.raise_for_status()

        return response
