# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import coreapi
import coreschema
from dynamic_rest.viewsets import DynamicModelViewSet, WithDynamicViewSetMixin
from rest_framework import mixins, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.schemas import AutoSchema
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework_extensions.mixins import NestedViewSetMixin
from rest_framework_jwt.authentication import JSONWebTokenAuthentication
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


class NestedDynamicViewSet(NestedViewSetMixin, DynamicModelViewSet):
    pass


class StudentViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    StudentViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(StudentViewSetSchema, self).get_link(path, method, base_url)
        return set_link(StudentViewSet, path, method, link)


class StudentViewSet(NestedDynamicViewSet):
    """
    allows interaction with the set of "Student" instances
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = StudentSerializer
    queryset = Student.objects.all()

    """ define custom schema for documentation """
    schema = StudentViewSetSchema()

    """ ensure variables show as correct types for docs """
    name_case_manager = 'case_manager'
    desc_case_manager = "ID of the User who oversees this student"

    case_manager_field = coreapi.Field(name=name_case_manager,
                                       required=True,
                                       location="form",
                                       description=desc_case_manager,
                                       schema=coreschema.Integer(title=name_case_manager)),

    create_fields = (
        case_manager_field
    )
    update_fields = (
        case_manager_field
    )
    partial_update_fields = (
        case_manager_field
    )


class TermViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    BehaviorViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(TermViewSetSchema, self).get_link(path, method, base_url)
        return set_link(TermViewSet, path, method, link)


class TermViewSet(NestedDynamicViewSet):
    """
    allows interaction with the set of "Student" instances
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = TermSerializer
    queryset = Term.objects.all()

    """ define custom schema for documentation """
    schema = TermViewSetSchema()


class HolidayViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    HolidayViewSetSchema class in the coreapi documentation.
    """

    def get_link(self, path, method, base_url):
        link = super(HolidayViewSetSchema, self).get_link(path, method, base_url)
        return set_link(HolidayViewSet, path, method, link)


class HolidayViewSet(NestedDynamicViewSet):
    """
    allows interaction with the set of "Student" instances
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = HolidaySerializer
    queryset = Holiday.objects.all()

    """ define custom schema for documentation """
    schema = HolidayViewSetSchema()

    """ ensure variables show as correct types for docs """
    term_name = 'term'
    term_desc = 'Term this holiday starts in'

    term_field = coreapi.Field(
        name=term_name,
        required=True,
        location="form",
        description=term_desc,
        schema=coreschema.Integer(title=term_name))

    create_fields = (
        term_field,
    )
    update_fields = (
        term_field,
    )
    partial_update_fields = (
        term_field,
    )

class SectionViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    SectionViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(SectionViewSetSchema, self).get_link(path, method, base_url)
        return set_link(SectionViewSet, path, method, link)

class SectionViewSet(NestedDynamicViewSet):
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

class EnrollmentViewSet(NestedDynamicViewSet):
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

class BehaviorViewSet(NestedDynamicViewSet):
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


class StandardizedTestViewSet(NestedDynamicViewSet):
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


class StandardizedTestScoreViewSet(NestedDynamicViewSet):
    """
    allows interaction with the set of "StandardizedTestScore" instances

    list:
    gets all the standardized test score reports in Sprout.

    create:
    creates a new standardized test score report. requires a date, standardized_test id, and a score

    retrieve:
    gets the standardized test report specified by the id path param.

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
    queryset = StandardizedTestScore.objects.all()

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


class AssignmentViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    AssignmentViewSetSchema class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(AssignmentViewSetSchema, self).get_link(path, method, base_url)
        return set_link(AssignmentViewSet, path, method, link)


class AssignmentViewSet(NestedDynamicViewSet):
    """
    allows interaction with the set of "Assignment" instances

    list:
    gets all the assignments in Sprout.

    create:
    creates a new assignment. requires the section, assignment name, minimum score and maximum score

    retrieve:
    gets the assignment specified by the id path param.

    update:
    updates an existing assignment specified by the id path param.
    requires the section, assignment name, minimum score and maximum score

    partial_update:
    updates parts of an existing assignment specified by path param.
    does not require all values.

    delete:
    deletes the existing assignment specified by the path param.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = AssignmentSerializer
    queryset = Assignment.objects.all()

    """ define custom schema for documentation """
    schema = AssignmentViewSetSchema()

    """ ensure variables show as correct type for docs """
    name_section = 'section'
    desc_section = 'ID of the section to which this assignment belongs'
    create_fields = (
        coreapi.Field(
            name=name_section,
            required=True,
            location="form",
            description=desc_section,
            schema=coreschema.Integer(title=name_section)),
    )
    update_fields = (
        coreapi.Field(
            name=name_section,
            required=True,
            location="form",
            description=desc_section,
            schema=coreschema.Integer(title=name_section)),
    )
    partial_update_fields = (
        coreapi.Field(
            name=name_section,
            location="form",
            description=desc_section,
            schema=coreschema.Integer(title=name_section)),
    )


class GradeViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    GradeViewSet class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(GradeViewSetSchema, self).get_link(path, method, base_url)
        return set_link(GradeViewSet, path, method, link)


class GradeViewSet(NestedDynamicViewSet):
    """
    allows interaction with the set of "Grade" instances

    list:
    gets all the grade reports in Sprout.

    create:
    creates a new grade report. requires the assignment, student, score, and handin date

    retrieve:
    gets the grade report specified by the id path param.

    update:
    updates an existing grade report specified by the id path param.
    requires the assignment, student, score, and handin date

    partial_update:
    updates parts of an existing grade report specified by path param.
    does not require all values.

    delete:
    deletes the existing grade report specified by the path param.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = GradeSerializer
    queryset = Grade.objects.all()

    """ define custom schema for documentation """
    schema = GradeViewSetSchema()

    """ ensure variables show as correct type for docs """
    name_assignment = 'assignment'
    name_student = 'student'
    desc_assignment = 'ID of the assignment to which this grade belongs'
    desc_student = 'ID of the student owning this grade report'
    create_fields = (
        coreapi.Field(
            name=name_assignment,
            required=True,
            location="form",
            description=desc_assignment,
            schema=coreschema.Integer(title=name_assignment)),

        coreapi.Field(
            name=name_student,
            required=True,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
    )
    update_fields = (
        coreapi.Field(
            name=name_assignment,
            required=True,
            location="form",
            description=desc_assignment,
            schema=coreschema.Integer(title=name_assignment)),

        coreapi.Field(
            name=name_student,
            required=True,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
    )
    partial_update_fields = (
        coreapi.Field(
            name=name_assignment,
            location="form",
            description=desc_assignment,
            schema=coreschema.Integer(title=name_assignment)),

        coreapi.Field(
            name=name_student,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
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
        if include_user == 'true':
            response['user'] = {
                'email': request._user.email,
                'first_name': request._user.sproutuserprofile.first_name,
                'last_name': request._user.sproutuserprofile.last_name,
                'pk': request._user.id,
            }

        return Response(data=response)


class SproutUserViewSet(WithDynamicViewSetMixin,
                        mixins.UpdateModelMixin,
                        mixins.DestroyModelMixin,
                        ReadOnlyModelViewSet):
    """
    allows read-only access to the registered Users in Sprout

    list:
    gets all the registered Users in Sprout

    retrieve:
    get a specific registered User in Sprout

    delete:
    remove a specified User from Sprout

    update:
    change the particulars of a User in Sprout

    partial_update:
    change the particulars of a User in Sprout
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = SproutUserSerializer
    def get_queryset(self, queryset=None):
        queryset = SproutUser.objects.all()
        return queryset


class NotificationViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    NotificationViewSetSchema class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(NotificationViewSetSchema, self).get_link(path, method, base_url)
        return set_link(NotificationViewSet, path, method, link)


class NotificationViewSet(NestedDynamicViewSet):
    """
    allows interaction with the set of "Notification" instances

    list:
    gets all the notifications in Sprout.

    create:
    creates a new notification. requires the title, body, date, student, user, and category

    retrieve:
    gets the notification specified by the id path param.

    update:
    updates an existing notification specified by the id path param.
    requires the title, body, date, student, user, and category

    partial_update:
    updates parts of an existing notification specified by path param.
    does not require all values.

    delete:
    deletes the existing notification specified by the path param.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = NotificationSerializer
    queryset = Notification.objects.all()

    """ define custom schema for documentation """
    schema = NotificationViewSetSchema()

    """ ensure variables show as correct type for docs """
    name_user = 'user'
    name_student = 'student'
    desc_user = 'ID of the user to whom this notification should be displayed'
    desc_student = 'ID of the student to whom this notification refers'
    create_fields = (
        coreapi.Field(
            name=name_user,
            required=True,
            location="form",
            description=desc_user,
            schema=coreschema.Integer(title=name_user)),

        coreapi.Field(
            name=name_student,
            required=True,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
    )
    update_fields = (
        coreapi.Field(
            name=name_user,
            required=True,
            location="form",
            description=desc_user,
            schema=coreschema.Integer(title=name_user)),

        coreapi.Field(
            name=name_student,
            required=True,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
    )
    partial_update_fields = (
        coreapi.Field(
            name=name_user,
            location="form",
            description=desc_user,
            schema=coreschema.Integer(title=name_user)),

        coreapi.Field(
            name=name_student,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
    )


class FocusStudentViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    FocusStudentViewSetSchema class in the coreapi documentation.
    """
    def get_link(self, path, method, base_url):
        link = super(FocusStudentViewSetSchema, self).get_link(path, method, base_url)
        return set_link(FocusStudentViewSet, path, method, link)


class FocusStudentViewSet(NestedDynamicViewSet):
    """
    allows interaction with the set of "FocusStudent" instances

    list:
    gets all the focus students in Sprout.

    create:
    creates a new focus students. requires the title, body, date, student, user, and category

    retrieve:
    gets the focus students specified by the id path param.

    update:
    updates an existing focus students specified by the id path param.
    requires the student, user, and focus_category

    partial_update:
    updates parts of an existing focus students specified by path param.
    does not require all values.

    delete:
    deletes the existing focus students specified by the path param.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = FocusStudentSerializer
    queryset = FocusStudent.objects.all()

    """ define custom schema for documentation """
    schema = FocusStudentViewSetSchema()

    """ ensure variables show as correct type for docs """
    name_user = 'user'
    name_student = 'student'
    desc_user = 'ID of the user who wants to focus on this student'
    desc_student = 'ID of the student being focused'
    create_fields = (
        coreapi.Field(
            name=name_user,
            required=True,
            location="form",
            description=desc_user,
            schema=coreschema.Integer(title=name_user)),

        coreapi.Field(
            name=name_student,
            required=True,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
    )
    update_fields = (
        coreapi.Field(
            name=name_user,
            required=True,
            location="form",
            description=desc_user,
            schema=coreschema.Integer(title=name_user)),

        coreapi.Field(
            name=name_student,
            required=True,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
    )
    partial_update_fields = (
        coreapi.Field(
            name=name_user,
            location="form",
            description=desc_user,
            schema=coreschema.Integer(title=name_user)),

        coreapi.Field(
            name=name_student,
            location="form",
            description=desc_student,
            schema=coreschema.Integer(title=name_student)),
    )


class IEPGoalViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    HolidayViewSetSchema class in the coreapi documentation.
    """

    def get_link(self, path, method, base_url):
        link = super(IEPGoalViewSetSchema, self).get_link(path, method, base_url)
        return set_link(IEPGoalViewSet, path, method, link)


class IEPGoalViewSet(NestedDynamicViewSet):
    """
    allows interaction with the set of "Student" instances
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = IEPGoalSerializer
    queryset = IEPGoal.objects.all()

    # define custom schema for documentation
    schema = IEPGoalViewSetSchema()

    # ensure variables show as correct types for docs
    student_name = 'student'
    student_desc = 'Student whose goal this is'

    student_field = coreapi.Field(
        name=student_name,
        required=True,
        location="form",
        description=student_desc,
        schema=coreschema.Integer(title=student_name))

    create_fields = (
        student_field,
    )
    update_fields = (
        student_field,
    )
    partial_update_fields = (
        student_field,
    )


class IEPGoalNoteViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    HolidayViewSetSchema class in the coreapi documentation.
    """

    def get_link(self, path, method, base_url):
        link = super(IEPGoalNoteViewSetSchema, self).get_link(path, method, base_url)
        return set_link(IEPGoalNoteViewSet, path, method, link)


class IEPGoalNoteViewSet(NestedDynamicViewSet):
    """
    allows interaction with the set of "Student" instances
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = IEPGoalNoteSerializer
    queryset = IEPGoalNote.objects.all()

    # define custom schema for documentation
    schema = IEPGoalNoteViewSetSchema()

    # ensure variables show as correct types for docs
    iep_name = 'goal'
    iep_desc = 'IEPGoal to which this note belongs'

    iep_field = coreapi.Field(
        name=iep_name,
        required=True,
        location="form",
        description=iep_desc,
        schema=coreschema.Integer(title=iep_name))

    create_fields = (
        iep_field,
    )
    update_fields = (
        iep_field,
    )
    partial_update_fields = (
        iep_field,
    )


class ServiceRequirementViewSetSchema(AutoSchema):
    """
    class that allows specification of more detailed schema for the
    HolidayViewSetSchema class in the coreapi documentation.
    """

    def get_link(self, path, method, base_url):
        link = super(ServiceRequirementViewSetSchema, self).get_link(path, method, base_url)
        return set_link(ServiceRequirementViewSet, path, method, link)


class ServiceRequirementViewSet(NestedDynamicViewSet):
    """
    allows interaction with the set of "Student" instances
    """
    permission_classes = (IsAuthenticated,)
    queryset = ServiceRequirement.objects.all()
    serializer_class = ServiceRequirementSerializer

    # define custom schema for documentation
    schema = ServiceRequirementViewSetSchema()

    # ensure variables show as correct types for docs
    student_name = 'student'
    student_desc = 'Student to whom this service requirement applies'

    student_field = coreapi.Field(
        name=student_name,
        required=True,
        location="form",
        description=student_desc,
        schema=coreschema.Integer(title=student_name))

    create_fields = (
        student_field,
    )
    update_fields = (
        student_field,
    )
    partial_update_fields = (
        student_field,
    )
