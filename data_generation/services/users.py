
import requests
import json

from collections import namedtuple

from base_service import BaseService

User = namedtuple("User", ['id', 'email', 'first_name', 'last_name'])


class UsersService(BaseService):

    def __init__(self, **kwargs):
        super(UsersService, self).__init__(**kwargs)
        self.complete_list_uri = self.complete_uri_template.format(endpoint="/users/")
        self.complete_register_uri = self.complete_uri_template.format(endpoint="/registration/")

    def get_users(self):
        """
        Download a complete list of users

        :return: list of user objects
        :rtype: list[User]
        """
        return self._get_models(User, self.complete_list_uri)

    def register_user(self, user, password=None, throw_error=True):
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

        data = json.dumps(data)

        self.headers['content-type'] = 'application/json'

        response = requests.post(self.complete_register_uri, data=data, verify=self.verify, headers=self.headers)
        if throw_error:
            response.raise_for_status()

        return response
