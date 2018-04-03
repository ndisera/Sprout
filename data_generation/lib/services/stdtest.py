
from collections import namedtuple

from base_service import BaseService

StandardizedTest = namedtuple("StandardizedTest", ['test_name', 'min_score', 'max_score', 'proficient_score', 'id'])
StandardizedTest.__new__.__defaults__ = (None, None, )

class StandardizedTestService(BaseService):

    def __init__(self, **kwargs):
        super(StandardizedTestService, self).__init__(**kwargs)
        self.complete_uri = self.complete_uri_template.format(endpoint="/tests/standardized")

    def get_standardized_tests(self):
        """
        Download a complete list of standardized_tests

        :return: list of standardized_test objects
        :rtype: list[Student]
        """
        return self._get_models(StandardizedTest, self.complete_uri)

    def add_standardized_test(self, standardized_test):
        """
        Upload a student object to the server

        :param standardized_test: StandardizedTest object to upload
        :type standardized_test: StandardizedTest
        """
        return self.add_many_standardized_tests([standardized_test])

    def add_many_standardized_tests(self, standardized_tests):
        """
        Upload a list of standardized_test objects to the server

        :param standardized_tests: List of standardized_test objects
        :return:
        """
        return self._add_many_models(standardized_tests, self.complete_uri)