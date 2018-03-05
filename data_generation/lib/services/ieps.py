
from collections import namedtuple

from base_service import BaseService

IEPGoal = namedtuple("IEPGoal", ['id', 'student', 'title', 'quantitative',
                             'quantitative_category', 'quantitative_range_low',
                             'quantitative_range_upper', 'due_date', ])
IEPGoal.__new__.__defaults__ = (None, None, None, None, None, None, None, None, )


class IEPService(BaseService):

    def __init__(self, **kwargs):
        super(IEPService, self).__init__(**kwargs)
        self.uri_template = self.complete_uri_template.format(endpoint="/students/{student_pk}/ieps/")

    def get_iep_goals(self, student_id):
        """
        Download a complete list of IEPGoals for the requested student

        :param student_id: Student to reference
        :return: list of IEPGoal objects
        :rtype: list[IEPGoal]
        """
        uri = self.uri_template.format(student_pk=student_id)
        return self._get_models(IEPGoal, uri)

    def add_many_iep_goals(self, goals, student_id):
        """
        Upload a list of IEPGoal objects for the specified student to the server

        :param goals: List of IEPGoal objects
        :param student_id: Student to reference
        :return:
        """
        uri = self.uri_template.format(student_pk=student_id)
        return self._add_many_models(goals, uri)
