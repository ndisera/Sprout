from dynamic_rest.serializers import DynamicModelSerializer
from dynamic_rest.fields import DynamicRelationField
from api.models import *
from rest_auth.serializers import LoginSerializer
from rest_auth.registration.serializers import RegisterSerializer


class TeacherSerializer(DynamicModelSerializer):
    class Meta:
        model = Teacher
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class StudentSerializer(DynamicModelSerializer):
    class Meta:
        model = Student
        fields = ('id', 'student_id', 'first_name', 'last_name', 'birthdate', 'case_manager')
    #case_manager = DynamicRelationField('UserSerializer')


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


class StandardizedTestSerializer(DynamicModelSerializer):
    class Meta:
        model = StandardizedTest
        fields = ('id', 'test_name', 'min_score', 'max_score',)


class StandardizedTestScoreSerializer(DynamicModelSerializer):
    class Meta:
        model = StandardizedTestScore
        fields = ('id', 'standardized_test', 'student', 'date', 'score',)
    standardized_test = DynamicRelationField('StandardizedTestSerializer')
    student = DynamicRelationField('StudentSerializer')


class AssignmentSerializer(DynamicModelSerializer):
    class Meta:
        model = Assignment
        fields = ('id', 'section', 'assignment_name', 'score_min', 'score_max', 'due_date')
    section = DynamicRelationField('SectionSerializer')


class GradeSerializer(DynamicModelSerializer):
    class Meta:
        model = Grade
        fields = ('id', 'assignment', 'student', 'handin_datetime', 'score',)
    assignment = DynamicRelationField('AssignmentSerializer')
    student = DynamicRelationField('StudentSerializer')


class SproutLoginSerializer(LoginSerializer):
    class Meta:
        excluse = ('username', )


class SproutRegisterSerializer(RegisterSerializer):
    class Meta:
        exclude = ('username', )
        fields = ('id', 'email', 'first_name', 'last_name', )

