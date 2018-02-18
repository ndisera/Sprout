from dynamic_rest.serializers import DynamicModelSerializer, WithDynamicModelSerializerMixin
from dynamic_rest.fields import DynamicRelationField
from api.models import *
from rest_framework import serializers
from rest_auth.serializers import LoginSerializer, UserDetailsSerializer
from rest_auth.registration.serializers import RegisterSerializer


class TeacherSerializer(DynamicModelSerializer):
    class Meta:
        model = Teacher
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class StudentSerializer(DynamicModelSerializer):
    class Meta:
        model = Student
        fields = ('id', 'student_id', 'first_name', 'last_name', 'birthdate', 'case_manager')
    case_manager = DynamicRelationField('SproutUserSerializer')


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
        exclude = ('username', )


class SproutRegisterSerializer(RegisterSerializer):
    first_name = serializers.CharField(source='sproutuserprofile.first_name')
    last_name = serializers.CharField(source='sproutuserprofile.last_name')

    def custom_signup(self, request, user):
        profile_data = self.validated_data.pop('sproutuserprofile', {})
        first_name = profile_data.get('first_name')
        last_name = profile_data.get('last_name')
        profile = SproutUserProfile(user=user, first_name=first_name, last_name=last_name)
        profile.save()
        self.instance = user

    def to_representation(self, instance):
        representation = super(SproutRegisterSerializer, self).to_representation(instance)
        user_profile = {'first_name' : instance.sproutuserprofile.first_name,
                        'last_name' : instance.sproutuserprofile.last_name,
                        }
        representation['sproutuserprofile'] = user_profile
        return representation

    class Meta:
        fields = ('email', )
        optional_fields = ('password1', 'password2', )

        pass


class SproutUserSerializer(WithDynamicModelSerializerMixin, UserDetailsSerializer):
    first_name = serializers.CharField(source='sproutuserprofile.first_name')
    last_name = serializers.CharField(source='sproutuserprofile.last_name')

    class Meta(UserDetailsSerializer.Meta):
        fields = []
        fields.extend(UserDetailsSerializer.Meta.fields)
        fields.extend(('first_name', 'last_name', ))
        if 'username' in fields:
            del fields[fields.index('username')]

    def create(self, validated_data):
        instance = super(SproutUserSerializer, self).create(validated_data)
        pass

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('sproutuserprofile', {})
        first_name = profile_data.get('first_name')
        last_name = profile_data.get('last_name')

        instance = super(SproutUserSerializer, self).update(instance, validated_data)
        try:
            profile = instance.sproutuserprofile
        except SproutUserProfile.DoesNotExist:
            profile = SproutUserProfile(user=instance, first_name=first_name, last_name=last_name)

        profile_changed = False
        if first_name:
            profile.first_name = first_name
            profile_changed = True
        if last_name:
            profile.last_name = last_name
            profile_changed = True
        if profile_changed:
            profile.save()

        return instance


class NotificationSerializer(DynamicModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'title', 'body', 'date', 'student', 'user', 'category', 'unread', )
    user = DynamicRelationField('SproutUserSerializer')
    student = DynamicRelationField('StudentSerializer')


class FocusStudentSerializer(DynamicModelSerializer):
    class Meta:
        model = FocusStudent
        fields = ('id', 'student', 'user', 'ordering', 'focus_category', 'progress_category', 'caution_category', )
    user = DynamicRelationField('SproutUserSerializer')
    student = DynamicRelationField('StudentSerializer')
