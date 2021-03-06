from django.test import TestCase
from django.db import IntegrityError
from api.models import *

import datetime

class BehaviorTestCase(TestCase):
    def setUp(self):
        self.teacher = SproutUser.objects.create(email="sredman@example.com",
                                                 first_name="Simon",
                                                 last_name="Redman")

        self.student = Student.objects.create(student_id="dev890918",
                                              first_name="Graham",
                                              last_name="Zuber",
                                              birthdate="1989-09-18")

        self.section = Section.objects.create(title="Computer Science",
                                              teacher=self.teacher)

        self.enrollment = Enrollment.objects.create(section=self.section,
                                                    student=self.student)

        self.behavior_date = datetime.date.today()

        Behavior.objects.create(enrollment=self.enrollment,
                                date=self.behavior_date,
                                behavior=5,
                                effort=5)

    def test_behavior_exists(self):
        """
        Test that the database returns something given an enrollment
        """
        behavior = Behavior.objects.get(enrollment=self.enrollment)
        self.assertTrue(behavior is not None,
                        "Unable to load Behavior from the database")

    def test_behavior_date(self):
        """
        Test that the database returns the correct behavior score
        """
        behavior = Behavior.objects.get(enrollment=self.enrollment)
        self.assertEqual(behavior.date,
                         self.behavior_date,
                         "Incorrect date returned")

    def test_behavior_behavior(self):
        """
        Test that the database returns the correct behavior score
        """
        behavior = Behavior.objects.get(enrollment=self.enrollment)
        self.assertEqual(behavior.behavior,
                         5,
                         "Incorrect behavior score returned")

    def test_behavior_effort(self):
        """
        Test that the database returns the correct behavior score
        """
        behavior = Behavior.objects.get(enrollment=self.enrollment)
        self.assertEqual(behavior.effort,
                         5,
                         "Incorrect effort score returned")

    def test_behavior_date_enrollment_uniqueness(self):
        """
        Test that the database blocks putting a behavior score with the same date and enrollment

        This test is expected to raise an error because the enrollment and date are not unique
        """
        with self.assertRaises(IntegrityError):
            Behavior.objects.create(enrollment=self.enrollment,
                                    date=self.behavior_date,
                                    behavior=1,
                                    effort=1)
