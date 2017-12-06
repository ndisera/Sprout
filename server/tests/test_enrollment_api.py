from django.test import TestCase
from api.models import Enrollment
from api.models import Section
from api.models import Student
from api.models import Teacher

import datetime

class EnrollmentTestCase(TestCase):
    def setUp(self):
        self.teacher = Teacher.objects.create(username="sredman",
                                              email="sredman@example.com",
                                              first_name="Simon",
                                              last_name="Redman")

        self.section = Section.objects.create(title="Computer Science",
                                              teacher=self.teacher)

        self.student = Student.objects.create(student_id="dev890918",
                                              first_name="Graham",
                                              last_name="Zuber",
                                              birthdate="1989-09-18")

        Enrollment.objects.create(section=self.section,
                                  student=self.student)

    def test_enrollment_exists(self):
        """
        Test that the database returns something given a name
        """
        enrollment = Enrollment.objects.get(student=self.student)
        self.assertTrue(enrollment is not None,
                        "Unable to load Enrollment from the database")

    def test_enrollment_student(self):
        """
        Test that the database returns the proper student
        """
        enrollment = Enrollment.objects.get(student=self.student)
        self.assertEqual(enrollment.student,
                         self.student,
                         "Incorrect title returned")

    def test_enrollment_section(self):
        """
        Test that the database returns the proper section
        """
        enrollment = Enrollment.objects.get(student=self.student)
        self.assertEqual(enrollment.section,
                         self.section,
                         "Incorrect title returned")