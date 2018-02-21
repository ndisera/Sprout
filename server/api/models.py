# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.db import models
from django.conf import settings

from sprout_user import SproutUser, SproutUserProfile


class Student(models.Model):
    """
    Student
    Represents a student in the system.
    student_id must be unique
    """
    student_id = models.CharField(unique=True, blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)
    first_name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)
    last_name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)
    birthdate = models.DateField(blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    case_manager = models.ForeignKey(SproutUser, blank=True, null=True)

    class Meta:
        ordering = ('id',)


class Term(models.Model):
    """
    Term
    Represent a school term, such as a particular semester, quarter, etc.
    """
    name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                            help_text="Term name, such as \"Fall\" or \"First Quarter\"")
    start_date = models.DateField(blank=False,
                                  help_text="Term start date, such as 2018-01-18 for the 18th of January, 2018")
    end_date = models.DateField(blank=False,
                                help_text="Term end date")
    # TODO: Some 'versioning' on a School Schedule object


class Section(models.Model):
    """
    Section
    Represents a section (most likely class) in the system.
    teacher is a foreign key to the User who teaches leads the section
    """
    title = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)
    teacher = models.ForeignKey(SproutUser)
    term = models.ForeignKey(Term, on_delete=models.CASCADE,
                             help_text="Term this section takes place in")
    # TODO: Uncomment when Schedule model exists
    # schedule = models.ForeignKey(Schedule,
    #                              help_text="Class start/end schedule used in this semester")

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
    test_name = models.CharField(unique=True, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)
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
        unique_together = (('standardized_test', 'date', 'student'),)
        ordering = ('date',)


class Assignment(models.Model):
    """
    Assignment
    Represent a class's assignment
    """
    section = models.ForeignKey(Section, related_name='assignment_section',
                                   verbose_name="Section to which this assigment belongs")
    assignment_name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)
    score_min = models.IntegerField(blank=False, verbose_name="Minimum Score")
    score_max = models.IntegerField(blank=False, verbose_name="Maximum Score")
    due_date = models.DateField(blank=False,)

    class Meta:
        unique_together = (('section', 'assignment_name', 'due_date'),)
        ordering = ('due_date',)


class Grade(models.Model):
    """
    Grade
    Represent a student grade report
    """
    assignment = models.ForeignKey(Assignment, related_name='grade_assignment',
                                  verbose_name="Assignment being reported")
    student = models.ForeignKey(Student, related_name='grade_student')
    score = models.IntegerField(blank=False, verbose_name="Assignment score")
    handin_datetime = models.DateTimeField(blank=False)

    class Meta:
        unique_together = (('assignment', 'student', 'handin_datetime'),)
        ordering = ('assignment',)


class Notification(models.Model):
    """
    Notification
    Represent and store a notification which should be displayed to a User
    """
    title = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)
    body = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)
    date = models.DateTimeField(blank=False)
    student = models.ForeignKey(Student, blank=False)
    user = models.ForeignKey(SproutUser, blank=False)
    category = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                help_text="Partial string of an API call, combined with student to create a URL from this notification")
    unread = models.BooleanField(blank=False, default=False)

    class Meta:
        # Do we want to enforce any uniqueness for notifications?
        ordering = ('date', 'user',)


class FocusStudent(models.Model):
    student = models.ForeignKey(Student, blank=False)
    user = models.ForeignKey(SproutUser, blank=False)
    ordering = models.IntegerField(blank=False)
    focus_category = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                      help_text="Category selected by the user to display")
    progress_category = models.CharField(null=True, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                         help_text="Category Sprout has identified is going well")
    caution_category = models.CharField(null=True, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                        help_text="Category Sprout has identified needs attention")
    refresh_date = models.DateTimeField(auto_now=True,
                                        help_text="Record the last time this entry was updated, to ensure it is updated regularly")

    class Meta:
        ordering = ('user', 'ordering', )
        unique_together = (('user', 'student'), )
