
from collections import namedtuple

from base_service import BaseService

ServiceRequirement = namedtuple("ServiceRequirement",
                                ['student', 'title', 'description', 'fulfilled', 'fulfilled_date',
                                 'fulfilled_user', 'fulfilled_description', 'type', 'id', ])
ServiceRequirement.__new__.__defaults__ = (None, )


class ServiceService(BaseService):

    def __init__(self, **kwargs):
        super(ServiceService, self).__init__(**kwargs)
        self.uri_template = self.complete_uri_template.format(endpoint="/students/{student_pk}/services/")

    def get_services(self, student_id):
        """
        Download a complete list of ServiceRequirements for the requested student

        :param student_id: Student to reference
        :return: list of ServiceRequirement objects
        :rtype: list[ServiceRequirement]
        """
        uri = self.uri_template.format(student_pk=student_id)
        return self._get_models(ServiceRequirement, uri)

    def add_many_services(self, services, student_id):
        """
        Upload a list of ServiceRequirement objects for the specified student to the server

        :param goals: List of ServiceRequirement objects
        :param student_id: Student to reference
        :return:
        """
        uri = self.uri_template.format(student_pk=student_id)
        return self._add_many_models(services, uri)
