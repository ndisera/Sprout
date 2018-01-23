# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import coreapi
import coreschema
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.schemas import AutoSchema
from api.models import *
from api.serializers import *

class SproutViewSet(viewsets.ModelViewSet):
    """
    define a new class for viewsets in Sprout
    
    this class allows a viewset to define a 'serializers' dictionary
    with different serializers for each action of a viewset (i.e.
    list, create, etc...)
    """
    serializers = {
        'default': None,
    }

    def get_serializer_class(self):
        return self.serializers.get(self.action, self.serializers['default'])

def union_fields(fields, new_fields):
    """
    takes the union of two fields sets
    necessary to specify what makes a field unique (name)
    """
    fields_list = list(fields)
    for f in list(new_fields):
        # if it's not in the set, add it
        if len(filter(lambda x: x.name == f.name, fields_list)) == 0:
            fields_list.append(f)
        # if it's in the set already, replace it
        else:
            fields_list = map(lambda x:x if x.name != f.name else f, fields_list)
    return fields_list

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
        return copy_link(link, union_fields(link.fields, class_id.list_fields))
    elif method == "POST" and hasattr(class_id, 'create_fields'):
        return copy_link(link, union_fields(link.fields, class_id.create_fields))
    elif method == "GET" and hasattr(class_id, 'retrieve_fields'):
        return copy_link(link, union_fields(link.fields, class_id.retrieve_fields))
    elif method == "PUT" and hasattr(class_id, 'update_fields'):
        return copy_link(link, union_fields(link.fields, class_id.update_fields))
    elif method == "PATCH" and hasattr(class_id, 'partial_update_fields'):
        return copy_link(link, union_fields(link.fields, class_id.partial_update_fields))
    elif method == "DELETE" and hasattr(class_id, 'delete_fields'):
        return copy_link(link, union_fields(link.fields, class_id.delete_fields))
    else:
        return link


class TeacherViewSet(SproutViewSet):
    """
    allows interaction with the set of "Teacher" instances
    """
    queryset = Teacher.objects.all()
    serializers = {
        'default': TeacherSerializer,
    }

class StudentViewSet(SproutViewSet):
    """
    allows interaction with the set of "Student" instances
    """
    permission_classes = (IsAuthenticated,)
    queryset = Student.objects.all()
    serializers = {
        'default': StudentSerializer,
    }

class SectionViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    SectionViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(SectionViewSetSchema, self).get_link(path, method, base_url)
        return set_link(SectionViewSet, path, method, link)

class SectionViewSet(SproutViewSet):
    """
    allows interaction with the set of "Section" instances

    list:
    gets all the sections registered in Sprout.

    create:
    creates a new section. requires a title and teacher id. teacher id 
    represents the teacher of the class

    retrieve:
    gets the section specified by the id path param.

    update:
    updates an existing section specified by the id path param. requires a 
    section id, title, and teacher id.

    partial_update:
    updates parts of an existing section specified by the path param. 
    does not require all values.

    delete:
    deletes the existing section specified by the path param.
    """
    serializers = {
        'default': SectionSerializer,
    }

    query_teacher = 'teacher'
    def get_queryset(self):
        queryset = Section.objects.all()
        teacher = self.request.query_params.get(self.query_teacher, None)
        if teacher is not None:
            queryset = queryset.filter(teacher=teacher)
        return queryset

    """ schema related class variables """
    schema = SectionViewSetSchema()
    name_teacher = 'teacher'
    desc_teacher = "ID of the teacher of the section."
    list_fields = (
        coreapi.Field(
            name=query_teacher, 
            location="query", 
            description="ID of teacher. Used to filter sections by teacher.",
            schema=coreschema.String(title=query_teacher)),
    )

    create_fields = (
        coreapi.Field(
            name=name_teacher, 
            required=True,
            location="form", 
            description=desc_teacher,
            schema=coreschema.Integer(title=name_teacher)),
    )

    update_fields = (
        coreapi.Field(
            name=name_teacher, 
            required=True,
            location="form", 
            description=desc_teacher,
            schema=coreschema.Integer(title=name_teacher)),
    )

    partial_update_fields = (
        coreapi.Field(
            name=name_teacher, 
            location="form", 
            description=desc_teacher,
            schema=coreschema.Integer(title=name_teacher)),
    )


class EnrollmentViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    EnrollmentViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(EnrollmentViewSetSchema, self).get_link(path, method, base_url)
        return set_link(EnrollmentViewSet, path, method, link)

class EnrollmentViewSet(SproutViewSet):
    """
    allows interaction with the set of "Enrollment" instances

    list:
    gets all the enrollments registered in Sprout.

    create:
    creates a new enrollment. requires a student id and section id.

    retrieve:
    gets the enrollment specified by the id path param.

    update:
    updates an existing enrollment specified by the id path param. 
    requires an enrollment id, student id, and section id.

    partial_update:
    updates parts of an existing enrollment specified by the id path param.
    does not require all values.

    delete:
    deletes the existing enrollment specified by the path param.
    """
    serializers = {
        'default': EnrollmentSerializer,
    }

    query_student = 'student'
    query_section = 'section'
    def get_queryset(self):
        queryset = Enrollment.objects.all()
        student = self.request.query_params.get(self.query_student, None)
        section = self.request.query_params.get(self.query_section, None)

        if student is not None:
            queryset = queryset.filter(student=student)
        if section is not None:
            queryset = queryset.filter(section=section)
        return queryset

    """ schema related class variables """
    name_student = 'student'
    name_section = 'section'
    desc_student = 'ID of the student'
    desc_section = 'ID of the section'
    schema = EnrollmentViewSetSchema()
    list_fields = (
        coreapi.Field(
            name=query_student, 
            location="query", 
            description="ID of student, used to filter enrollments by student",
            schema=coreschema.String(title=query_student)),
        coreapi.Field(
            name=query_section, 
            location="query", 
            description="ID of section, used to filter enrollments by section",
            schema=coreschema.String(title=query_section)),
    )

    create_fields = (
        coreapi.Field(
            name=name_student,
            required=True,
            location="form", 
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
        coreapi.Field(
            name=name_section,
            required=True,
            location="form", 
            description=desc_section,
            schema=coreschema.Integer(title=name_section)),
    )

    update_fields = (
        coreapi.Field(
            name=name_student,
            required=True,
            location="form", 
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
        coreapi.Field(
            name=name_section, 
            required=True,
            location="form", 
            description=desc_section,
            schema=coreschema.Integer(title=name_section)),
    )

    partial_update_fields = (
        coreapi.Field(
            name=name_student,
            location="form", 
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
        coreapi.Field(
            name=name_section, 
            location="form", 
            description=desc_section,
            schema=coreschema.Integer(title=name_section)),
    )


class BehaviorViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    BehaviorViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(BehaviorViewSetSchema, self).get_link(path, method, base_url)
        return set_link(BehaviorViewSet, path, method, link)

class BehaviorViewSet(SproutViewSet):
    """
    allows interaction with the set of "Behavior" instances

    list:
    gets all the behavior reports in Sprout.

    create:
    creates a new behavior report. requires a date, enrollment id,
    behavior score, and effort score.

    retrieve:
    gets the behavior report specified by the id path param.

    update:
    updates an existing behavior report specified by the id path param. 
    requires a date, enrollment id, behavior score, and effort score.

    partial_update:
    updates parts of an existing behavior report specified by path param.
    does not require all values.

    delete:
    deletes the existing behavior report specified by the path param.
    """
    serializers = {
        'list':    BehaviorRetrieveSerializer,
        'retrieve':    BehaviorRetrieveSerializer,
        'default': BehaviorSerializer,
    }

    query_student = 'student'
    query_section = 'section'
    query_start_date = 'start_date'
    query_end_date = 'end_date'
    def get_queryset(self):
        queryset = Behavior.objects.all()
        student = self.request.query_params.get(self.query_student, None)
        section = self.request.query_params.get(self.query_section, None)
        start_date = self.request.query_params.get(self.query_start_date, None)
        end_date = self.request.query_params.get(self.query_end_date, None)

        if student is not None:
            enrolls = Enrollment.objects.filter(student=student)
            queryset = queryset.filter(enrollment_id__in=enrolls)

        if section is not None:
            enrolls = Enrollment.objects.filter(section=section)
            queryset = queryset.filter(enrollment_id__in=enrolls)

        if start_date is not None:
            queryset = queryset.filter(date__gte=start_date)

        if end_date is not None:
            queryset = queryset.filter(date__lte=end_date)

        queryset.order_by('date')
        return queryset

    """ schema related class variables """
    name_enrollment = 'enrollment'
    desc_enrollment = 'ID of the enrollment (student and section)'
    schema = BehaviorViewSetSchema()
    list_fields = (
        coreapi.Field(
            name=query_student, 
            location="query", 
            description="ID of student, used to filter behavior reports by student",
            schema=coreschema.String(title=query_student)),
        coreapi.Field(
            name=query_section, 
            location="query", 
            description="ID of section, used to filter behavior reports by section",
            schema=coreschema.String(title=query_section)),
        coreapi.Field(
            name=query_start_date, 
            location="query", 
            description="start date of to filter query by date, inclusive. of the format YYYY-MM-DD",
            schema=coreschema.String(title=query_start_date)),
        coreapi.Field(
            name=query_end_date, 
            location="query", 
            description="end date of to filter query by date, inclusive. of the format YYYY-MM-DD",
            schema=coreschema.String(title=query_end_date)),
    )
    
    create_fields = (
        coreapi.Field(
            name=name_enrollment,
            required=True,
            location="form", 
            description=desc_enrollment,
            schema=coreschema.Integer(title=name_enrollment)),
    )

    update_fields = (
        coreapi.Field(
            name=name_enrollment,
            required=True,
            location="form", 
            description=desc_enrollment,
            schema=coreschema.Integer(title=name_enrollment)),
    )

    partial_update_fields = (
        coreapi.Field(
            name=name_enrollment,
            location="form", 
            description=desc_enrollment,
            schema=coreschema.Integer(title=name_enrollment)),
    )
















