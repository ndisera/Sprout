# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

import api.constants as constants

from sprout_user import SproutUser

import os

def get_sentinel_user():
    return get_user_model().objects.get_or_create(email='deleted_user',)[0]


class ProfilePicture(models.Model):
    """
    ProfilePicture
    Store a user or student's profile picture
    This should never be referenced from more than one model!
    """
    file = models.ImageField(upload_to='profile_pictures/', null=True, default='profile_pictures/default.png',
                             help_text="Base64 encoded image upload")
    upload_time = models.DateTimeField(auto_now=True)

    def __repr__(self):
        return str(self.file)

    def __str__(self):
        return self.__repr__()

    def delete(self, **kwargs):
        filename = self.file.name
        super(ProfilePicture, self).delete(**kwargs)
        os.remove(filename)
        pass


class SproutUserProfile(models.Model):
    user = models.OneToOneField(SproutUser, on_delete=models.CASCADE,
                                help_text="User to which this profile information belongs")
    first_name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                  help_text="User first name")
    last_name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                 help_text="User last name")
    picture = models.OneToOneField(ProfilePicture, on_delete=models.SET_NULL,
                                   blank=True, null=True,
                                   help_text="User's Profile Picture")

from school_settings.models import *


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
    case_manager = models.ForeignKey(SproutUser, blank=True, null=True, on_delete=models.SET_NULL)
    picture = models.OneToOneField(ProfilePicture, on_delete=models.SET_NULL,
                                   blank=True, null=True,
                                   help_text="Student's Profile Picture")
    grade_level = models.SmallIntegerField(blank=True, null=True,
                                           help_text="The student's grade level")

    class Meta:
        ordering = ('id',)

    def __repr__(self):
        return "{} {}".format(self.first_name, self.last_name)

    def __str__(self):
        return self.__repr__()

    def save(self, **kwargs):
        ret = super(Student, self).save(**kwargs)
        # Delete all notifications associated with this student so they can be re-generated later
        # in case relevant data changed
        Notification.objects.filter(student=self).delete()
        return ret


class ParentContactInfo(models.Model):
    """
    ParentContactInfo
    Store the contact information for a student's parent or guardian
    There may be more than one of this model per student to allow multiple parents/guardians
    """
    student = models.ForeignKey(Student, null=False,
                                help_text="Student whoes parent or guardian has their contact information stored here")
    first_name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                  help_text="Parent or guardian's first name")
    last_name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                 help_text="Parent or guardian's last name")
    email = models.EmailField(blank=True, null=True,
                              help_text="Parent or guardian's email address")
    phone = models.CharField(blank=True, null=True, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                             help_text="Parent or guardian's phone number")


class Section(models.Model):
    """
    Section
    Represents a section (most likely class) in the system.
    teacher is a foreign key to the User who teaches leads the section
    """
    title = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)
    teacher = models.ForeignKey(SproutUser, null=True, blank=True, on_delete=models.SET_NULL)
    term = models.ForeignKey(Term, on_delete=models.CASCADE,
                             help_text="Term this section takes place in")
    # Lookup the class schedule via term's TermSettings
    schedule_position = models.IntegerField(blank=True, null=True,
                                            help_text="Relative position in the schedule this class takes place")

    class Meta:
        ordering = ('id',)

    def __repr__(self):
        return str(self.teacher) + ' ' + str(self.title)

    def __str__(self):
        return self.__repr__()


class Enrollment(models.Model):
    """
    Enrollment
    Represents an enrollment relationship in the system. That is, a
    student that is enrolled in a section.
    section and student are a composite, unique key
    """
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('section', 'student'),)
        ordering = ('section',)

    def __repr__(self):
        return "{student} in {section}".format(student=repr(self.student), section=repr(self.section))

    def __str__(self):
        return self.__repr__()

    def delete(self, using=None, keep_parents=False):
        """
        Cleanup notifications between this enrollment's section's teacher
        and the student if the enrollment is deleted
        :return: 
        """
        old_student = self.student
        old_teacher = self.section.teacher
        old_notifications = Notification.objects.filter(student=old_student, user=old_teacher)
        for notification in old_notifications:
            notification.delete()
        return super(Enrollment, self).delete(using, keep_parents)


class Behavior(models.Model):
    """
    Behavior
    Represents a student's behavior score in a class on a
    given day.
    """
    enrollment = models.ForeignKey(Enrollment, related_name='enrollment', on_delete=models.CASCADE)
    date = models.DateField()
    behavior = models.IntegerField(blank=True, null=True)
    effort = models.IntegerField(blank=True, null=True)

    class Meta:
        unique_together = (('enrollment', 'date'),)
        ordering = ('date',)


class BehaviorNote(models.Model):
    """
    BehaviorNote
    Record a free-text note about one student's behavior on a particular day (not tied to a class)
    Note that it is allowed to have more than one note per student per day. This is intentional.
    """
    date = models.DateField(blank=False,
                            help_text="Date to which this note applies")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=False,
                                help_text="Student to whom this note corresponds")
    body = models.CharField(null=False, blank=False, max_length=settings.DESCRIPTION_CHARFIELD_MAX_LENGTH,
                             help_text="Body of this note (max length {})".format(settings.DESCRIPTION_CHARFIELD_MAX_LENGTH))

    class Meta:
        ordering = ('date', )


class AttendanceRecord(models.Model):
    """
    AttendanceRecord
    Keep track of whether a student did not attend a particular class or was late, etc.
    """
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE,
                                   help_text="Enrollment associated with this attendance report")
    date = models.DateTimeField(null=False, blank=False,
                                help_text="Date this attendace record was recorded")
    short_code = models.CharField(blank=False, max_length=3,
                                  help_text="Short code of this attendance record, for digest viewing")
    description = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                  help_text="Human-readable description of this attendance record")

    class Meta:
        unique_together = [('enrollment', 'date'),]


class StandardizedTestScore(models.Model):
    """
    StandardizedTestScore
    Represents a particular student's score on a particular standardized test on a particular date
    """
    standardized_test = models.ForeignKey(StandardizedTest, related_name='standardized_test', on_delete=models.CASCADE)
    student = models.ForeignKey(Student, related_name="student", on_delete=models.CASCADE)
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
    section = models.ForeignKey(Section, related_name='assignment_section', on_delete=models.CASCADE,
                                   verbose_name="Section to which this assigment belongs")
    assignment_name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)
    score_min = models.IntegerField(blank=False, verbose_name="Minimum Score")
    score_max = models.IntegerField(blank=False, verbose_name="Maximum Score")
    due_date = models.DateField(blank=False,)

    class Meta:
        unique_together = (('section', 'assignment_name', 'due_date'),)
        ordering = ('due_date',)

    def __repr__(self):
        return str(self.section) + ' ' + str(self.assignment_name)

    def __str__(self):
        return self.__repr__()


class Grade(models.Model):
    """
    Grade
    Represent a student grade report
    """
    assignment = models.ForeignKey(Assignment, related_name='grade_assignment', on_delete=models.CASCADE,
                                   verbose_name="Assignment being reported",
                                   help_text="Assignment being reported")
    student = models.ForeignKey(Student, related_name='grade_student', on_delete=models.CASCADE,
                                help_text="Student being graded")
    score = models.IntegerField(blank=False, verbose_name="Assignment score")
    handin_datetime = models.DateTimeField(blank=False)

    class Meta:
        unique_together = (('assignment', 'student', 'handin_datetime'),)
        ordering = ('assignment',)


class FinalGrade(models.Model):
    """
    FinalGrade
    Represent the student's weighted score, assuming assignments don't all have the same weight,
    and a letter grade
    """
    enrollment = models.ForeignKey(Enrollment, related_name='finalgrade_enrollment', on_delete=models.CASCADE,
                                   unique=True,
                                   help_text="The enrollment being graded")
    final_percent = models.IntegerField(blank=False,
                                        help_text="The weighted final grade for this enrollment")
    letter_grade = models.CharField(null=True, max_length=3,
                                    help_text="A codified representation of the grade, such as A-F or 1-5")


class Notification(models.Model):
    """
    Notification
    Represent and store a notification which should be displayed to a User
    """
    title = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                             help_text="Short name of this notification")
    body = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                            help_text="Longer description of this notification")
    date = models.DateTimeField(blank=False,
                                help_text="Date this notification is 'due'")
    student = models.ForeignKey(Student, blank=False, on_delete=models.CASCADE,
                                help_text="Student to whom this notification refers")
    user = models.ForeignKey(SproutUser, blank=False, on_delete=models.CASCADE,
                             help_text="User who should be notified")
    partial_link = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                help_text="Partial string of an API call, combined with student to create a URL from this notification")
    unread = models.BooleanField(blank=False, default=False)
    category = models.IntegerField(blank=False,
                                   help_text="Machine-readable category of this notification. See api/constants.py")

    class Meta:
        # Do we want to enforce any uniqueness for notifications?
        ordering = ('date', 'user',)


class FocusStudent(models.Model):
    student = models.ForeignKey(Student, blank=False, on_delete=models.CASCADE)
    user = models.ForeignKey(SproutUser, blank=False, on_delete=models.CASCADE)
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


class IEPGoal(models.Model):
    """
    IEPGoal
    Represent a student's Individualized Education Plan goal
    """
    student = models.ForeignKey(Student, blank=False, on_delete=models.CASCADE)
    title = models.CharField(null=False, blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                             help_text="Short name of this IEP Goal")
    quantitative = models.BooleanField(blank=True,
                                       help_text="Optionally, whether this IEP goal tracks quantitative information")
    quantitative_category = models.CharField(null=True, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                             help_text="Optional quantitative category associated with this goal")
    quantitative_range_low = models.IntegerField(null=True,
                                                 help_text="If defined, lower bound of the quantitative category value")
    quantitative_range_upper = models.IntegerField(null=True,
                                                   help_text="If defined, upper bound of the quantitative category value")
    quantitative_target = models.IntegerField(null=True,
                                              help_text="Optional value indicating where the quantitative IEP Goal should fall")
    due_date = models.DateField(null=False,
                                help_text="Date when this IEP Goal should be completed")


class IEPGoalDatapoint(models.Model):
    """
    IEPGoalDatapoint
    Represent one custom quantitative datapoint associated with an IEPGoal
    """
    goal = models.ForeignKey(IEPGoal, blank=False, on_delete=models.CASCADE,
                                help_text="IEPGoal this datapoint belongs to")
    value = models.IntegerField(help_text="Data value of this datapoint")
    date = models.DateField(help_text="Date this measurement was taken")
    note = models.CharField(null=True, max_length=settings.DESCRIPTION_CHARFIELD_MAX_LENGTH,
                            help_text="Note associated with this datapoint (max length {})".format(
                                settings.DESCRIPTION_CHARFIELD_MAX_LENGTH))

    class Meta:
        ordering = ('goal', 'date', )


class IEPGoalNote(models.Model):
    """
    IEPGoalNote
    Represent a note associated with an IEPGoal
    """
    goal = models.ForeignKey(IEPGoal, blank=False, on_delete=models.CASCADE,
                                help_text="IEPGoal this note belongs to")
    title = models.CharField(null=False, blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                             help_text="Name of this note")
    body = models.CharField(null=False, blank=False, max_length=settings.DESCRIPTION_CHARFIELD_MAX_LENGTH,
                             help_text="Body of this note (max length {})".format(settings.DESCRIPTION_CHARFIELD_MAX_LENGTH))
    date = models.DateField(auto_now=True,
                                help_text="Date this note was last updated")

    class Meta:
        ordering = ('goal', 'date', )


class ServiceRequirement(models.Model):
    student = models.ForeignKey(Student, blank=False, on_delete=models.CASCADE)
    title = models.CharField(null=False, blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                             help_text="Short name of this service requirement")
    description = models.CharField(null=False, blank=False, max_length=settings.DESCRIPTION_CHARFIELD_MAX_LENGTH,
                                   help_text="Description of this service requirement (max length {})".format(
                                       settings.DESCRIPTION_CHARFIELD_MAX_LENGTH))
    fulfilled = models.BooleanField(help_text="Whether or not this service has been fulfilled")
    fulfilled_date = models.DateField(null=True,
                                      help_text="Date this service was marked fulfilled")
    fulfilled_user = models.ForeignKey(SproutUser, null=True, on_delete=models.SET(get_sentinel_user),
                                       help_text="User who marked this service fulfilled")
    fulfilled_description = models.CharField(null=True, max_length=settings.DESCRIPTION_CHARFIELD_MAX_LENGTH,
                                             help_text="How this service is fulfilled (max length {})".format(
                                                 settings.DESCRIPTION_CHARFIELD_MAX_LENGTH))
    type = models.IntegerField(null=False, blank=False,
                               choices=constants.ServiceType.choices(),
                               help_text="What type of service this is, as defined by constants.ServiceType")

    def __repr__(self):
        if self.fulfilled :
            try:
                user_email = self.fulfilled_user.email
            except SproutUser.DoesNotExist:
                user_email = 'deleted user'
            return 'ServiceRequirement: {title} for {student_first} {student_last}: fulfilled by {user}'.format(
                title=self.title,
                student_first=self.student.first_name,
                student_last=self.student.last_name,
                user=user_email,
            )
        return 'ServiceRequirement: {title} for {student_first} {student_last}: unfulfilled'.format(
            title=self.title,
            student_first=self.student.first_name,
            student_last=self.student.last_name,
        )

    def __str__(self):
        return self.__repr__()
