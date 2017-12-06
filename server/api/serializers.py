from rest_framework import serializers
from django.db import models
from api.models import *

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ('id', 'student_id', 'first_name', 'last_name', 'birthdate')

class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ('id', 'title', 'teacher')

class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ('id', 'section', 'student')

class BehaviorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Behavior
        fields = ('id', 'enrollment', 'date', 'behavior', 'effort')
