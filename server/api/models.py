# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.db import models

DEFAULT_MAX_LENGTH = 100

"""
Teacher
Represents a teacher in the system (also a Sprout user).
username and email must be unique.
"""
class Teacher(models.Model):
    """ this is a testy test """
    username = models.CharField(unique=True, max_length=DEFAULT_MAX_LENGTH, blank=False)
    email = models.EmailField(unique=True, blank=False)
    first_name = models.CharField(blank=False, max_length=DEFAULT_MAX_LENGTH)
    last_name = models.CharField(blank=False, max_length=DEFAULT_MAX_LENGTH)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('id',)

"""
Student
Represents a student in the system.
student_id must be unique
"""
class Student(models.Model):
    student_id = models.CharField(unique=True, blank=False, max_length=DEFAULT_MAX_LENGTH)
    first_name = models.CharField(blank=False, max_length=DEFAULT_MAX_LENGTH)
    last_name = models.CharField(blank=False, max_length=DEFAULT_MAX_LENGTH)
    birthdate = models.DateField(blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('id',)

"""
Class
Represents a class in the system.
teacher is a forgeign key to Teacher
"""
class Class(models.Model):
    title = models.CharField(blank=False, max_length=DEFAULT_MAX_LENGTH)
    teacher = models.ForeignKey(Teacher)

    class Meta:
        ordering = ('id',)

