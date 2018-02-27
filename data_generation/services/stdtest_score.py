
from collections import namedtuple

from base_service import BaseService

StandardizedTestScore = namedtuple("StandardizedTestScore", ['date', 'standardized_test', 'score', 'student', 'id'])


class StandardizedTestScoreService(BaseService):

    def __init__(self, **kwargs):
        super(StandardizedTestScoreService, self).__init__(**kwargs)
        self.complete_uri = self.complete_uri_template.format(endpoint="/standardized_test_scores")

    def get_standardized_test_scores(self):
        """
        Download a complete list of standardized_test_scores

        :return: list of standardized_test_score objects
        :rtype: list[Student]
        """
        return self._get_models(StandardizedTestScore, self.complete_uri)

    def add_standardized_test_score(self, standardized_test_score):
        """
        Upload a student object to the server

        :param standardized_test_score: StandardizedTestScore object to upload
        :type standardized_test_score: StandardizedTestScore
        """
        return self.add_many_standardized_test_scores([standardized_test_score])

    def add_many_standardized_test_scores(self, standardized_test_scores):
        """
        Upload a list of standardized_test_score objects to the server

        :param standardized_test_scores: List of standardized_test_score objects
        :return:
        """
        return self._add_many_models(standardized_test_scores, self.complete_uri)
