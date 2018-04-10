
from collections import namedtuple

from base_service import BaseService


Enrollment = namedtuple("Enrollment", ['section', 'student', 'id'])


class EnrollmentService(BaseService):

    def __init__(self, **kwargs):
        super(EnrollmentService, self).__init__(**kwargs)
        self.complete_uri = self.complete_uri_template.format(endpoint="/enrollments/")

    def get_enrollments(self, params=None):
        """
        Download a complete list of enrollments, with optional filters

        :param params: dict representing filter_key -> filter_val
        :return: list of enrollment objects
        :rtype: list[Enrollment]
        """
        return self._get_models(Enrollment, self.complete_uri, params=self._prepare_params(params))

    def add_enrollment(self, enrollment):
        """
        Upload a enrollment object to the server

        :param enrollment: Enrollment object to upload
        :type enrollment: Enrollment
        """
        return self.add_many_enrollments([enrollment])

    def add_many_enrollments(self, enrollments):
        """
        Upload a list of enrollment objects to the server

        :param enrollments: List of enrollment objects
        :return:
        """
        return self._add_many_models(enrollments, self.complete_uri)
