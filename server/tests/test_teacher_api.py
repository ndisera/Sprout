from django.test import TestCase
from api.models import Teacher
from django.db import IntegrityError

import datetime

class SectionTestCase(TestCase):
    def setUp(self):
        Teacher.objects.create(username="sredman",
                               email="sredman@example.com",
                               first_name="Simon",
                               last_name="Redman")

    def test_teacher_exists(self):
        """
        Test that the database returns something given a name
        """
        simon = Teacher.objects.get(first_name="Simon")
        self.assertTrue(simon is not None, # Because that would be tragic
                        "Unable to load Teacher Simon from the database")

    def test_teacher_username(self):
        """
        Test that the database returns the proper username
        """
        simon = Teacher.objects.get(first_name="Simon")
        self.assertEqual(simon.username,
                         "sredman",
                         "Incorrect username returned")

    def test_teacher_email(self):
        """
        Test that the database returns the proper email
        """
        simon = Teacher.objects.get(first_name="Simon")
        self.assertEqual(simon.email,
                         "sredman@example.com",
                         "Incorrect email returned")

    def test_teacher_firstname(self):
        """
        Test that the database returns the proper first name
        """
        simon = Teacher.objects.get(first_name="Simon")
        self.assertEqual(simon.first_name,
                         "Simon",
                         "Incorrect first_name returned")

    def test_teacher_lastname(self):
        """
        Test that the database returns the proper last name
        """
        simon = Teacher.objects.get(first_name="Simon")
        self.assertEqual(simon.last_name,
                         "Redman",
                         "Incorrect first_name returned")

    def test_email_uniqueness(self):
        """
        Test that the database blocks putting the same email twice

        This test is expected to raise an error because email is not unique
        """
        with self.assertRaises(IntegrityError):
            Teacher.objects.create(username="eviltwin",
                                   email="sredman@example.com",
                                   first_name="Evil",
                                   last_name="Twin")

    def test_username_uniqueness(self):
        """
        Test that the database blocks putting the same username twice

        This test is expected to raise an error because username is not unique
        """
        with self.assertRaises(IntegrityError):
            Teacher.objects.create(username="sredman",
                                   email="eviltwin@example.com",
                                   first_name="Evil",
                                   last_name="Twin")
