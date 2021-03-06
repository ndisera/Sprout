
from collections import namedtuple

from base_service import BaseService

Assignment = namedtuple("Assignment", ['section', 'assignment_name', 'score_min', 'score_max', 'due_date', 'id', 'import_id'])


class AssignmentService(BaseService):

    def __init__(self, **kwargs):
        super(AssignmentService, self).__init__(**kwargs)
        self.uri_template = self.complete_uri_template.format(endpoint="/sections/{sections_pk}/assignments/")

    def get_assignments(self, section, params=None):
        """
        Download a complete list of assignments for a specified section

        :param section: ID of the section to consider
        :type section: num
        :param params: dict representing filter_key -> filter_val
        :return: list of assignment objects
        :rtype: list[Assignment]
        """
        uri = self.uri_template.format(sections_pk=section)
        return self._get_models(Assignment, uri, params=self._prepare_params(params))

    def add_assignment(self, assignment, section):
        """
        Upload an assignment object to the server under the specified section

        :param assignment: Assignment object to upload
        :type assignment: Assignment
        :param section: ID of the section to post these assignments to
        :type section: num
        """
        return self.add_many_assignments(assignments=[assignment], section=section)

    def add_many_assignments(self, assignments, section):
        """
        Upload a list of assignment objects to the server under the specified section

        :param assignments: List of assignment objects
        :type assignment: Assignment
        :param section: ID of the section to post these assignments to
        :type section: num
        :return:
        """
        uri = self.uri_template.format(sections_pk=section)
        return self._add_many_models(assignments, uri)

    def delete_assignment(self, assignment, section):
        """
        Delete an assignment object from the server under the specified section

        :param assignment: Assignment object to upload
        :type assignment: Assignment
        :param section: ID of the section to delete these assignments from
        :type section: num
        """
        return self.delete_many_assignments(assignments=[assignment], section=section)

    def delete_many_assignments(self, assignments, section):
        """
        Delete a list of assignment objects from the server under the specified section

        :param assignments: List of assignment objects
        :type assignment: Assignment
        :param section: ID of the section to delete these assignments from
        :type section: num
        :return:
        """
        uri = self.uri_template.format(sections_pk=section)
        return self._delete_many_models(assignments, uri)




