from django.test import TestCase
from api.models import Student

import datetime

class StudentTestCase(TestCase):
    def setUp(self):
        Student.objects.create(first_name="Simon", last_name="Redman", birthdate="1995-01-18")

    def test_student_exists(self):
        simon = Student.objects.get(first_name="Simon")
        self.assertTrue(simon is not None, # Because that would be tragic
                        "Unable to load Simon from the database")

    def test_student_firstname(self):
        simon = Student.objects.get(first_name="Simon")
        self.assertEqual(simon.last_name,
                         "Redman",
                         "Incorrect first_name returned")

    def test_student_lastname(self):
        simon = Student.objects.get(first_name="Simon")
        self.assertEqual(simon.last_name,
                         "Redman",
                         "Incorrect last_name returned")

    def test_student_birthday(self):
        simon = Student.objects.get(first_name="Simon")
        self.assertEqual(simon.birthdate,
                         datetime.date(year=1995, month=1, day=18),
                         "Incorrect birthday returned")