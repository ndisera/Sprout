
from collections import namedtuple

from base_service import BaseService

Term = namedtuple("Term", ['name', 'start_date', 'end_date', 'settings', 'school_year', 'id', 'import_id'])


class TermService(BaseService):

    def __init__(self, **kwargs):
        super(TermService, self).__init__(**kwargs)
        self.complete_uri = self.complete_uri_template.format(endpoint="/terms/")

    def get_terms(self):
        """
        Download a complete list of terms

        :return: list of term objects
        :rtype: list[Terms]
        """
        return self._get_models(Term, self.complete_uri)

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
        return self._add_many_models(terms, self.complete_uri)
