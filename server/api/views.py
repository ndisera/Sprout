# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import coreapi
import coreschema
from rest_framework import status, viewsets, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework_jwt.authentication import JSONWebTokenAuthentication
from rest_framework.response import Response
from rest_framework.schemas import AutoSchema
from dynamic_rest.viewsets import DynamicModelViewSet
from api.models import *
from api.serializers import *

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


class TeacherViewSet(DynamicModelViewSet):
    """
    allows interaction with the set of "Teacher" instances
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = TeacherSerializer
    queryset = Teacher.objects.all()

class StudentViewSet(DynamicModelViewSet):
    """
    allows interaction with the set of "Student" instances
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = StudentSerializer
    queryset = Student.objects.all()

class SectionViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    SectionViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(SectionViewSetSchema, self).get_link(path, method, base_url)
        return set_link(SectionViewSet, path, method, link)

class SectionViewSet(DynamicModelViewSet):
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
    permission_classes = (IsAuthenticated,)
    serializer_class = SectionSerializer
    queryset = Section.objects.all()

    """ define custom schema for documentation """
    schema = SectionViewSetSchema()

    """ ensure variables show as correct types for docs """
    name_teacher = 'teacher'
    desc_teacher = "ID of the teacher of the section."
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

class EnrollmentViewSet(DynamicModelViewSet):
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
    permission_classes = (IsAuthenticated,)
    serializer_class = EnrollmentSerializer
    queryset = Enrollment.objects.all()

    """ define custom schema """
    schema = EnrollmentViewSetSchema()

    """ ensure variables show as correct type for docs """
    name_student = 'student'
    name_section = 'section'
    desc_student = 'ID of the student'
    desc_section = 'ID of the section'
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

class BehaviorViewSet(DynamicModelViewSet):
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
    permission_classes = (IsAuthenticated,)
    serializer_class = BehaviorSerializer
    queryset = Behavior.objects.all()

    """ define custom schema for documentation """
    schema = BehaviorViewSetSchema()

    """ ensure variables show as correct type for docs """
    name_enrollment = 'enrollment'
    desc_enrollment = 'ID of the enrollment (student and section)'
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


class StandardizedTestViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    StandardizedTestViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(StandardizedTestViewSetSchema, self).get_link(path, method, base_url)
        return set_link(StandardizedTestViewSet, path, method, link)


class StandardizedTestViewSet(DynamicModelViewSet):
    """
    allows interaction with the set of "StandardizedTests" instances

    list:
    gets all the configured standardized tests in Sprout.

    create:
    inform Sprout about a new standardized test. requires a name and minimum and maximum score

    retrieve:
    gets the standardized test specified by the id path param.

    update:
    update the parameters of a recorded standardized test

    partial_update:
    update the parameters of a recorded standardized test specified by path param.
    does not require all values.

    delete:
    delete a specified standardized test specified by the path param.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = StandardizedTestSerializer
    queryset = StandardizedTest.objects.all()

    """ define custom schema for documentation """
    schema = StandardizedTestViewSetSchema()


class StandardizedTestScoreViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    StandardizedTestScoreViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(StandardizedTestScoreViewSetSchema, self).get_link(path, method, base_url)
        return set_link(StandardizedTestScoreViewSet, path, method, link)


class StandardizedTestScoreViewSet(DynamicModelViewSet):
    """
    allows interaction with the set of "StandardizedTestScore" instances

    list:
    gets all the standardized test score reports in Sprout.

    create:
    creates a new standardized test score report. requires a date, standardized_test id, and a score

    retrieve:
    gets the behavior report specified by the id path param.

    update:
    updates an existing standardized test score report specified by the id path param.
    requires a date, standardized_test id, and a score

    partial_update:
    updates an existing standardized test score report specified by the id path param.
    does not require all values.

    delete:
    deletes the existing standardized test score report specified by the path param.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = StandardizedTestScoreSerializer
    queryset = Behavior.objects.all()

    """ define custom schema for documentation """
    schema = StandardizedTestScoreViewSetSchema()

    """ ensure variables show as correct type for docs """
    name_student = 'student'
    desc_student = 'ID of the graded student'
    name_standardized_test = 'standardized_test'
    desc_standardized_test = 'ID of the related standardized test'
    create_fields = (
        coreapi.Field(
            name=name_student,
            required=True,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=desc_student)),

        coreapi.Field(
            name=name_standardized_test,
            required=True,
            location="form",
            description=desc_standardized_test,
            schema=coreschema.Integer(title=desc_standardized_test)),
    )
    update_fields = (
        coreapi.Field(
            name=name_student,
            required=True,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=desc_student)),

        coreapi.Field(
            name=name_standardized_test,
            required=True,
            location="form",
            description=desc_standardized_test,
            schema=coreschema.Integer(title=desc_standardized_test)),
    )
    partial_update_fields = (
        coreapi.Field(
            name=name_student,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=desc_student)),

        coreapi.Field(
            name=name_standardized_test,
            required=True,
            location="form",
            description=desc_standardized_test,
            schema=coreschema.Integer(title=desc_standardized_test)),
    )


class AuthVerifyView(generics.RetrieveAPIView):
    # If we ever add more authentication methods, this will need to be updated...
    authentication_classes = (JSONWebTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request, format=None):
        """
        Authentication-required noop to see if authentication tokens are valid

        If the authentication is valid, return some successful status

        If the authentication is invalid, return some authentication failure
        """
        response = {
            'message': 'Token valid',
        }

        include_user = request.query_params.get('user', None)
        print include_user
        if include_user == 'true':
            response['user'] = {
                'username': request._user.username,
                'email': request._user.email,
                'first_name': request._user.first_name,
                'last_name': request._user.last_name,
                'id': request._user.id,
            }
            
        return Response(data=response)