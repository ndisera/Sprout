from django.test import TestCase
from api.models import Teacher
from api.models import Section

import datetime

class SectionTestCase(TestCase):
    def setUp(self):
        self.teacher = Teacher.objects.create(username="sredman",
                                         email="sredman@example.com",
                                         first_name="Simon",
                                         last_name="Redman")

        Section.objects.create(title="Computer Science",
                               teacher=self.teacher)

    def test_section_exists(self):
        """
        Test that the database returns something given a name
        """
        section = Section.objects.get(title="Computer Science")
        self.assertTrue(section is not None, # Because that would be tragic
                        "Unable to load Section Computer Science from the database")

    def test_section_title(self):
        """
        Test that the database returns the proper title
        """
        section = Section.objects.get(title="Computer Science")
        self.assertEqual(section.title,
                         "Computer Science",
                         "Incorrect title returned")

    def test_section_title(self):
        """
        Test that the database returns the proper teacher
        """
        section = Section.objects.get(title="Computer Science")
        self.assertEqual(section.teacher,
                         self.teacher,
                         "Incorrect teacher returned")