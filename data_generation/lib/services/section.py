
from collections import namedtuple

from base_service import BaseService

Section = namedtuple("Section", ['teacher', 'title', 'term', 'schedule_position', 'id', 'import_id', ])


class SectionService(BaseService):

    def __init__(self, **kwargs):
        super(SectionService, self).__init__(**kwargs)
        self.complete_uri = self.complete_uri_template.format(endpoint="/sections/")

    def get_sections(self, params=None):
        """
        Download a complete list of sections, with optional filters

        :param params: dict representing filter_key -> filter_val
        :return: list of section objects
        :rtype: list[Section]
        """
        return self._get_models(Section, self.complete_uri, params=self._prepare_params(params))

    def add_section(self, section):
        """
        Upload a section object to the server

        :param section: Section object to upload
        :type section: Section
        """
        return self.add_many_sections([section])

    def add_many_sections(self, sections):
        """
        Upload a list of section objects to the server

        :param sections: List of section objects
        :return:
        """
        return self._add_many_models(sections, self.complete_uri)
