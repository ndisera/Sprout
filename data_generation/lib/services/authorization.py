
import os
import getpass
import requests

from base_service import BaseService

CERT_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../pki/rootCA_cert.pem")

class AuthorizationService(BaseService):
    """
    Helper class for containing all things to do with authorization
    """

    def __init__(self, **kwargs):
        super(AuthorizationService, self).__init__(**kwargs)

    def send_login_request(self, email, password):
        # type: (AuthorizationService, str, bool) -> str
        """
        Send a login request using the given username and password, return the auth token as a string

        :param user
        name: login email
        :type email: str
        :param password: login password
        :type password: str
        :return: Authorization token string
        :rtype: str
        """
        login_url = self.complete_uri_template.format(endpoint="/login/")

        json = {"email" : email,
                "password" :  password,}
        response = requests.post(login_url, json=json, verify=self.verify)

        if not (response.status_code >= 200 and response.status_code < 300):
            response.raise_for_status() # Raise an HTTP error

        reply = response.json()

        return str(reply["token"])

    @staticmethod
    def display_login_prompt(username=None, password=None):
        """
        Display a promt for the user to provide username and password

        :param username: existing username. Do not prompt the user if passed
        :type username: str
        :param password: existing password. Do not prompt the user if passed
        :type password: str
        :return: Tuple of username and password
        """

        if not username:
            username = raw_input("Sprout Login Email: ")
        if not password:
            password = getpass.getpass("Sprout Password for {}: ".format(username))

        return username, password
