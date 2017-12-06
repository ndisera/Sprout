# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.db import models

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
    teacher is a forgeign key to Teacher
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
    enrollment = models.ForeignKey(Enrollment, related_name='enrollment', unique_for_date='date')
    date = models.DateField()
    behavior = models.IntegerField()
    effort = models.IntegerField()

    class Meta:
        ordering = ('enrollment', 'date',)
