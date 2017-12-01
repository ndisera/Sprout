from django.test import TestCase
from api.models import Student

class StudentExistsTestCase(TestCase):
    def setUp(self):
        Student.objects.create(first_name="Simon", last_name="Redman")

    def test_student_exists(self):
        simon = Student.objects.get(first_name="Simon")
        self.assertTrue(simon is not None) # Because that would be tragic