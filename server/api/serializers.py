from rest_framework import serializers
from django.db import models
from api.models import Teacher, Student, Class

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ('id', 'student_id', 'first_name', 'last_name', 'birthdate')

class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ('id', 'title', 'teacher')
