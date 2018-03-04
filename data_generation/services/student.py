
from collections import namedtuple

from base_service import BaseService

Student = namedtuple("Student", ['student_id', 'first_name', 'last_name', 'birthdate', 'created', 'case_manager', 'picture', 'id'])


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
