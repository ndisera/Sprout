# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

"""
Student
Represents a student in the system. Primary key is Student ID.
TODO(gzuber): change primary key to be student id.
"""
class Student(models.Model):
    first_name = models.CharField(max_length=100, blank=False)
    last_name = models.CharField(max_length=100, blank=False)
    birthdate = models.DateField(blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('created',)
