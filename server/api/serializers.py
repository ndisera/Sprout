from rest_framework import serializers
from dynamic_rest.serializers import DynamicModelSerializer
from dynamic_rest.fields import DynamicRelationField
from django.db import models
from api.models import *

class TeacherSerializer(DynamicModelSerializer):
    class Meta:
        model = Teacher
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class StudentSerializer(DynamicModelSerializer):
    class Meta:
        model = Student
        fields = ('id', 'student_id', 'first_name', 'last_name', 'birthdate')

class SectionSerializer(DynamicModelSerializer):
    class Meta:
        model = Section
        fields = ('id', 'title', 'teacher')
    teacher = DynamicRelationField('TeacherSerializer')

class EnrollmentSerializer(DynamicModelSerializer):
    class Meta:
        model = Enrollment
        fields = ('id', 'section', 'student')
    section = DynamicRelationField('SectionSerializer')
    student = DynamicRelationField('StudentSerializer')

class BehaviorSerializer(DynamicModelSerializer):
    class Meta:
        model = Behavior
        fields = ('id', 'enrollment', 'date', 'behavior', 'effort')
    enrollment = DynamicRelationField('EnrollmentSerializer')

# class BehaviorRetrieveSerializer(serializers.ModelSerializer):
    # class Meta:
        # model = Behavior
        # fields = ('id', 'enrollment', 'date', 'behavior', 'effort')
        # depth = 1
