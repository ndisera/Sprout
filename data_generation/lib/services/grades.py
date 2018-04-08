
from collections import namedtuple

from base_service import BaseService

Grade = namedtuple("Grade", ['assignment', 'student', 'score', 'grade', 'handin_datetime', 'late', 'missing', 'id', ])
FinalGrade = namedtuple("FinalGrade", ['enrollment', 'letter_grade', 'final_percent', 'id', ])


class GradesService(BaseService):

    def __init__(self, **kwargs):
        super(GradesService, self).__init__(**kwargs)
        self.uri_template_sections = self.complete_uri_template.format(endpoint="/sections/{sections_pk}/assignments/{assignments_pk}/grades")
        self.uri_template_students = self.complete_uri_template.format(endpoint="/students/{students_pk}/grades/")
        self.uri_template_final_grade = self.complete_uri_template.format(endpoint="/students/{students_pk}/final-grades/")

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


    def get_final_grades(self, student, params=None):
        """
        Download a complete list of final grades for a specified student

        :param student: ID of the student
        :type student: num
        :param params: dict representing filter_key -> filter_val
        :type params: dict
        :return: list of final grades objects
        :rtype: list[FinalGrade]
        """
        uri = self.uri_template_final_grade.format(students_pk=student)
        return self._get_models(FinalGrade, uri, params=self._prepare_params(params))

    def add_final_grade(self, final_grade, student):
        """
        Upload a final_grade object to the server under the specified student

        :param final_grade: FinalGrade object to upload
        :type final_grade: FinalGrade
        :param student: ID of the student to post this FinalGrade to
        :type student: num
        """
        return self.add_many_final_grades(final_grades=[final_grade], student=student)

    def add_many_final_grades(self, final_grades, student):
        """
        Upload a list of final_grade objects to the server under the specified student

        :param final_grades: FinalGrade object to upload
        :type final_grades: list[FinalGrade]
        :param student: ID of the student to post this FinalGrade to
        :type student: num
        """
        uri = self.uri_template_final_grade.format(students_pk=student)
        return self._add_many_models(final_grades, uri)

    def delete_final_grade(self, final_grade, student):
        """
        Delete a final_grade object from the server under the specified student

        :param final_grade: FinalGrade object to delete
        :type final_grade: FinalGrade
        :param student: ID of the student to delete this FinalGrade from
        :type student: num
        """
        return self.delete_many_final_grades(final_grades=[final_grade], student=student)

    def delete_many_final_grades(self, final_grades, student):
        """
        Delete a list of final_grade objects from the server under the specified student

        :param final_grades: FinalGrade object to delete
        :type final_grades: list[FinalGrade]
        :param student: ID of the student to delete this FinalGrade from
        :type student: num
        """
        uri = self.uri_template_final_grade.format(students_pk=student)
        return self._delete_many_models(final_grades, uri)






