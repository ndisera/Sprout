
from collections import namedtuple

from base_service import BaseService

Student = namedtuple("Student", ['student_id', 'first_name', 'last_name', 'birthdate', 'created', 'case_manager', 'picture', 'grade_level', 'id', ])


class StudentService(BaseService):

    def __init__(self, **kwargs):
        super(StudentService, self).__init__(**kwargs)
        self.complete_uri = self.complete_uri_template.format(endpoint="/students/")

    def get_students(self):
        """
        Download a complete list of students

        :return: list of student objects
        :rtype: list[Student]
        """
        return self._get_models(Student, self.complete_uri)

    def filter_students(self, filter_key, filter_val):
        """
        Get a user with a specified filter_val for filter_key

        :param filter_key: key of property to filter
        :param filter_val: value of property for which to filter
        :return: list of user objects
        :rtype: list[User]
        """
        # filter_key = "filter{" + filter_key + "}"
        params = { "filter{" + filter_key + "}": filter_val, }
        # params = { filter_key: filter_val, }
        return self._get_models(Student, self.complete_uri, params)

    def add_student(self, student):
        """
        Upload a student object to the server

        :param student: Student object to upload
        :type student: Student
        """
        return self.add_many_students([student])

    def add_many_students(self, students):
        """
        Upload a list of student objects to the server

        :param students: List of student objects
        :return:
        """
        return self._add_many_models(students, self.complete_uri)
