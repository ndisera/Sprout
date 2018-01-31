# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.db import models

from django.core.validators import MaxValueValidator, MinValueValidator

DEFAULT_MAX_LENGTH = 100

class Teacher(models.Model):
    """
    Teacher
    Represents a teacher in the system (also a Sprout user).
    username and email must be unique.
    """
    username = models.CharField(unique=True, max_length=DEFAULT_MAX_LENGTH, blank=False)
    email = models.EmailField(unique=True, blank=False)
    first_name = models.CharField(blank=False, max_length=DEFAULT_MAX_LENGTH)
    last_name = models.CharField(blank=False, max_length=DEFAULT_MAX_LENGTH)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('id',)

class Student(models.Model):
    """
    Student
    Represents a student in the system.
    student_id must be unique
    """
    student_id = models.CharField(unique=True, blank=False, max_length=DEFAULT_MAX_LENGTH)
    first_name = models.CharField(blank=False, max_length=DEFAULT_MAX_LENGTH)
    last_name = models.CharField(blank=False, max_length=DEFAULT_MAX_LENGTH)
    birthdate = models.DateField(blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('id',)

class Section(models.Model):
    """
    Section
    Represents a section (most likely class) in the system.
    teacher is a foreign key to Teacher
    """
    title = models.CharField(blank=False, max_length=DEFAULT_MAX_LENGTH)
    teacher = models.ForeignKey(Teacher)

    class Meta:
        ordering = ('id',)

class Enrollment(models.Model):
    """
    Enrollment
    Represents an enrollment relationship in the system. That is, a
    student that is enrolled in a section.
    section and student are a composite, unique key
    """
    section = models.ForeignKey(Section)
    student = models.ForeignKey(Student)

    class Meta:
        unique_together = (('section', 'student'),)
        ordering = ('section',)

class Behavior(models.Model):
    """
    Behavior
    Represents a student's behavior score in a class on a
    given day.
    """
    enrollment = models.ForeignKey(Enrollment, related_name='enrollment')
    date = models.DateField()
    behavior = models.IntegerField(blank=True, null=True)
    effort = models.IntegerField(blank=True, null=True)

    class Meta:
        unique_together = (('enrollment', 'date'),)
        ordering = ('date',)

class StandardizedTest(models.Model):
    """
    StandardizedTest
    Represent a standardized test as enabled by the school
    """
    test_name = models.CharField(unique=True, max_length=DEFAULT_MAX_LENGTH)
    min_score = models.IntegerField(verbose_name="Minimum possible score", blank=False)
    max_score = models.IntegerField(verbose_name="Maximum possible score", blank=False)

    class Meta:
        ordering = ('id',)

class StandardizedTestScore(models.Model):
    """
    StandardizedTestScore
    Represents a particular student's score on a particular standardized test on a particular date
    """
    standardized_test = models.ForeignKey(StandardizedTest, related_name='standardized_test')
    student = models.ForeignKey(Student, related_name="student")
    date = models.DateField()
    score = models.IntegerField(blank=False, null=False)

    class Meta:
        unique_together = (('standardized_test', 'date'),)
        ordering = ('date',)

class Grade(models.Model):
    """
    Grade
    Represent a student grade report
    """
    enrollment = models.ForeignKey(Enrollment, related_name='grade_enrollment',
                                   verbose_name="Enrollment which this grade belongs to")
    assignment_name = models.CharField(unique=True, max_length=DEFAULT_MAX_LENGTH)
    percent = models.IntegerField(verbose_name="Grade from 0-100", blank=False,
                                  validators=[MinValueValidator(0), MaxValueValidator(100),])
    due_date = models.DateField(blank=False,)
    database_date = models.DateField(verbose_name="Date this grade was entered into Sprout",
                                     auto_now_add=True,
                                     blank=False)

    class Meta:
        unique_together = (('enrollment', 'assignment_name', 'due_date'),)
        ordering = ('due_date',)