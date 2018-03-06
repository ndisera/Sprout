
from collections import namedtuple

from base_service import BaseService

Behavior = namedtuple("Behavior", ['date', 'enrollment', 'behavior', 'effort', 'id', ])


class BehaviorService(BaseService):

    def __init__(self, **kwargs):
        super(BehaviorService, self).__init__(**kwargs)
        self.complete_uri = self.complete_uri_template.format(endpoint="/behaviors/")

    def get_behaviors(self):
        """
        Download a complete list of behaviors

        :return: list of behavior objects
        :rtype: list[Behavior]
        """
        return self._get_models(Behavior, self.complete_uri)

    def add_behavior(self, behavior):
        """
        Upload a behavior object to the server

        :param behavior: Behavior object to upload
        :type behavior: Behavior
        """
        return self.add_many_behaviors([behavior])

    def add_many_behaviors(self, behaviors):
        """
        Upload a list of behavior objects to the server

        :param behaviors: List of behavior objects
        :return:
        """
        return self._add_many_models(behaviors, self.complete_uri)
