
import getpass
import requests

class AuthorizationHandler():
    """
    Helper class for containing all things to do with authorization
    """

    def __init__(self, url="https://localhost", port_num=8000, verify=False):
        self.url = url
        self.port_num = port_num
        self.complete_uri = str(self.url) + ":" + str(self.port_num) + "/students/"
        self.verify = verify

    def send_login_request(self, username, password):
        # type: (str, str, bool) -> str
        """
        Send a login request using the given username and password, return the auth token as a string

        :param username: login username
        :type username: str
        :param password: login password
        :type password: str
        :param verify: whether the server's https certificate should be checked for authenticity
        :type verify: bool
        :return: Authorization token string
        :rtype: str
        """
        login_url = str(self.url) + ":" + str(self.port_num) + "/login/"

        json = {"username" : username,
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
            username = raw_input("Sprout Username: ")
        if not password:
            password = getpass.getpass("Sprout Password for {}: ".format(username))

        return username, password
