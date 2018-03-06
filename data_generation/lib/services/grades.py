
from collections import namedtuple

from base_service import BaseService

Grade = namedtuple("Grade", ['assignment', 'student', 'score', 'handin_datetime', 'id'])


class GradesService(BaseService):

    def __init__(self, **kwargs):
        super(GradesService, self).__init__(**kwargs)
        self.uri_template_sections = self.complete_uri_template.format(endpoint="/sections/{sections_pk}/assignments/{assignments_pk}/grades")
        self.uri_template_students = self.complete_uri_template.format(endpoint="/students/{students_pk}/grades/")

    def get_grades(self, section=None, assignment=None, student=None):
        """
        Download a complete list of grades either:
            for the specified assignment in the specified section
            for the specified student

        Either student or both section and assignment must be defined

        :return: list of grade objects
        :param section: ID of the section to which the assignment belongs
        :type section: num
        :param assignment: ID of the assignment to fetch grades for
        :type assignment: num
        :param student: ID of the student to fetch grades for
        :rtype: list[Grade]
        """

        if student is not None:
            complete_uri = self.uri_template_students.format(students_pk=student)
        elif section is not None and assignment is not None:
            complete_uri = self.uri_template_sections.format(sections_pk=section, assignments_pk=assignment)
        else:
            raise TypeError("get_grades must be called with either a studentID or both sectionID and assignmentID")

        return self._get_grades(uri=complete_uri)

    def _get_grades(self, uri):
        """
        Get grades using the endpoint specified in uri

        :param uri: complete URI to send a get request to
        :return: list[Grade]
        """
        return self._get_models(Grade, uri)

    def add_grade(self, grade, section=None, assignment=None, student=None):
        """
        Upload a grade object to the server under the specified assignment under the specified section

        :param grade: Grade object to upload
        :param section: ID of the section to which the assignment belongs
        :type section: num
        :param assignment: ID of the assignment to which the grade belongs
        :type assignment: num
        :param student: ID of the student to whom the grade belongs
        :type student: num
        :type grade: Grade
        """
        return self.add_many_grades([grade], section=section, assignment=assignment, student=student)

    def add_many_grades(self, grades, section=None, assignment=None, student=None ):
        """
        Upload a list of grade objects to the server under the specified assignment under the specified section

        :param grades: List of grade objects
        :param section: ID of the section to which the assignment belongs
        :type section: num
        :param assignment: ID of the assignment to which the grades belong
        :type assignment: num
        :param student: ID of the student to whom the grades belong
        :type student: num
        :return:
        """

        if student is not None:
            complete_uri = self.uri_template_students.format(students_pk=student)
        elif section is not None and assignment is not None:
            complete_uri = self.uri_template_sections.format(sections_pk=section, assignments_pk=assignment)
        else:
            raise TypeError("add_many_grades must be called with either a studentID or both sectionID and assignmentID")

        return self._add_many_grades(grades=grades, uri=complete_uri)

    def _add_many_grades(self, grades, uri):
        return self._add_many_models(grades, uri)