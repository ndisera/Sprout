# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import coreapi
import coreschema
from rest_framework import status, viewsets
from rest_framework.schemas import AutoSchema
from api.models import *
from api.serializers import *

def copy_link(link, fields):
    """ schema helper to copy a link with a new fields attribute. """
    return coreapi.Link(
            url=link.url,
            action=link.action,
            encoding=link.encoding,
            transform=link.transform,
            title=link.title,
            description=link.description,
            fields=fields)

def set_link(class_id, path, method, link):
    """
    schema helper to create new links if view class has fields 
    defined for any endpoints.
    """
    if method == "GET" and len(link.fields) == 0 and hasattr(class_id, 'list_fields'):
        return copy_link(link, class_id.list_fields)
    elif method == "POST" and hasattr(class_id, 'create_fields'):
        return copy_link(link, class_id.create_fields)
    elif method == "GET" and hasattr(class_id, 'read_fields'):
        return copy_link(link, class_id.read_fields)
    elif method == "PUT" and hasattr(class_id, 'update_fields'):
        return copy_link(link, class_id.update_fields)
    elif method == "PATCH" and hasattr(class_id, 'partial_update_fields'):
        return copy_link(link, class_id.partial_update_fields)
    elif method == "DELETE" and hasattr(class_id, 'delete_fields'):
        return copy_link(link, class_id.delete_fields)
    else:
        return link


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

class SectionViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    SectionViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(SectionViewSetSchema, self).get_link(path, method, base_url)
        return set_link(SectionViewSet, path, method, link)

class SectionViewSet(viewsets.ModelViewSet):
    """
    allows interaction with the set of "Section" instances

    list:
    gets all the sections registered in Sprout.

    create:
    creates a new section. requires a title and teacher id. teacher id 
    represents the teacher of the class

    read:
    gets the section specified by the id path param.

    update:
    updates an existing section. requires a section id, title, and teacher id.

    partial_update:
    updates parts of an existing section. does not require all values.

    """
    serializer_class = SectionSerializer

    def get_queryset(self):
        queryset = Section.objects.all()
        teacher = self.request.query_params.get('teacher', None)
        if teacher is not None:
            queryset = queryset.filter(teacher=teacher)
        return queryset

    """ schema related class variables """
    desc_teacher_id = "ID of the teacher of the section."
    desc_section_title = "title of the section."
    desc_section_id = "ID of the section."
    schema = SectionViewSetSchema()
    list_fields = [
        coreapi.Field(
            name="teacher", 
            location="query", 
            description="ID of teacher. Used to filter sections by teacher.",
            schema=coreschema.Integer(title="Teacher")),
        ]

    create_fields = [
        coreapi.Field(
            name="title", 
            required=True,
            location="form", 
            description=desc_section_title,
            schema=coreschema.String(title="Title")),
        coreapi.Field(
            name="teacher", 
            required=True,
            location="form", 
            description=desc_teacher_id,
            schema=coreschema.Integer(title="Teacher")),
        ]

    update_fields = [
        coreapi.Field(
            name="id", 
            required=True,
            location="path", 
            description=desc_section_id,
            schema=coreschema.String()),
        coreapi.Field(
            name="title", 
            required=True,
            location="form", 
            description=desc_section_title,
            schema=coreschema.String(title="Title")),
        coreapi.Field(
            name="teacher", 
            required=True,
            location="form", 
            description=desc_teacher_id,
            schema=coreschema.Integer(title="Teacher")),
        ]

    partial_update_fields = [
        coreapi.Field(
            name="id", 
            required=True,
            location="path", 
            description=desc_section_id,
            schema=coreschema.String()),
        coreapi.Field(
            name="title", 
            location="form", 
            description=desc_section_title,
            schema=coreschema.String(title="Title")),
        coreapi.Field(
            name="teacher", 
            location="form", 
            description=desc_teacher_id,
            schema=coreschema.Integer(title="Teacher")),
        ]

class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    """
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer






