# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.shortcuts import render
import coreapi
import coreschema
from rest_framework import status, viewsets
from rest_framework.schemas import AutoSchema
from api.models import Teacher, Student, Class
from api.serializers import TeacherSerializer, StudentSerializer, ClassSerializer

def copy_link(link, fields):
    return coreapi.Link(
            url=link.url,
            action=link.action,
            encoding=link.encoding,
            transform=link.transform,
            title=link.title,
            description=link.description,
            fields=fields)


class TeacherViewSet(viewsets.ModelViewSet):
    """
    allows interaction with the set of "Teacher" instances
    """
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer

class StudentViewSet(viewsets.ModelViewSet):
    """
    allows interaction with the set of "Student" instances
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

class ClassViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    ClassViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(ClassViewSetSchema, self).get_link(path, method, base_url)
        if method == "GET" and path == "/classes/":
            return copy_link(link, ClassViewSet.list_fields)
        elif method == "POST":
            return copy_link(link, ClassViewSet.create_fields)
        elif method == "PUT":
            return copy_link(link, ClassViewSet.update_fields)
        elif method == "PATCH":
            return copy_link(link, ClassViewSet.partial_update_fields)
        else:
            return link

class ClassViewSet(viewsets.ModelViewSet):
    """
    allows interaction with the set of "Class" instances

    list:
    gets all the classes registered in Sprout.

    create:
    creates a new class. requires a title and teacher id. teacher id 
    represents the teacher of the class

    read:
    gets the class specified by the id path param.

    update:
    updates an existing class. requires a class id, title, and teacher id.

    partial_update:
    updates parts of an existing class. does not require all values.

    """
    serializer_class = ClassSerializer

    def get_queryset(self):
        queryset = Class.objects.all()
        teacher = self.request.query_params.get('teacher', None)
        if teacher is not None:
            queryset = queryset.filter(teacher=teacher)
        return queryset

    """ schema related class variables """
    schema = ClassViewSetSchema()
    list_fields = [
        coreapi.Field(
            name="teacher", 
            location="query", 
            description="ID of teacher. Used to filter classes by teacher.",
            schema=coreschema.Integer(title="Teacher")),
        ]

    create_fields = [
        coreapi.Field(
            name="title", 
            required=True,
            location="form", 
            description="title of the class.",
            schema=coreschema.String(title="Title")),
        coreapi.Field(
            name="teacher", 
            required=True,
            location="form", 
            description="ID of the teacher of the class.",
            schema=coreschema.Integer(title="Teacher")),
        ]

    update_fields = [
        coreapi.Field(
            name="id", 
            required=True,
            location="path", 
            description="id of the class.",
            schema=coreschema.String()),
        coreapi.Field(
            name="title", 
            required=True,
            location="form", 
            description="title of the class.",
            schema=coreschema.String(title="Title")),
        coreapi.Field(
            name="teacher", 
            required=True,
            location="form", 
            description="ID of the teacher of the class.",
            schema=coreschema.Integer(title="Teacher")),
        ]

    partial_update_fields = [
        coreapi.Field(
            name="id", 
            required=True,
            location="path", 
            description="id of the class.",
            schema=coreschema.String()),
        coreapi.Field(
            name="title", 
            location="form", 
            description="title of the class.",
            schema=coreschema.String(title="Title")),
        coreapi.Field(
            name="teacher", 
            location="form", 
            description="ID of the teacher of the class.",
            schema=coreschema.Integer(title="Teacher")),
        ]








