from dynamic_rest.serializers import DynamicModelSerializer, WithDynamicModelSerializerMixin
from dynamic_rest.fields import DynamicRelationField
from api.models import *
import api.fields
from rest_framework import serializers
from rest_auth.serializers import LoginSerializer, UserDetailsSerializer
from rest_auth.registration.serializers import RegisterSerializer
from focus_category.category_calculator import CategoryCalculator


class ProfilePictureSerializer(DynamicModelSerializer):
    file = api.fields.Base64ImageField(max_length=None, use_url=True)

    class Meta:
        fields = '__all__'
        model = ProfilePicture


class StudentSerializer(DynamicModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

    def update(self, instance, validated_data):
        """
        Clean up notifications for a case manager when a student is reassigned
        """
        if 'case_manager' in validated_data:
            # If the case_manager is being updated, wipe all notifications
            # between the student and the old case manager
            old_case_manager = instance.case_manager
            old_notifications = Notification.objects.filter(student=instance, user=old_case_manager)
            for notification in old_notifications:
                notification.delete()
        return super(StudentSerializer, self).update(instance, validated_data)

    case_manager = DynamicRelationField('SproutUserSerializer')
    picture = DynamicRelationField('ProfilePictureSerializer')


class SchoolSettingsSerializer(DynamicModelSerializer):
    class Meta:
        model = SchoolSettings
        fields = '__all__'


class SchoolYearSerializer(DynamicModelSerializer):
    class Meta:
        model = SchoolYear
        fields = '__all__'

    def validate(self, data):
        super(SchoolYearSerializer, self).validate(data)

        if data['end_date'] < data['start_date']:
            raise serializers.ValidationError("A school year cannot end before it starts!")
        return data


class DailyScheduleSerializer(DynamicModelSerializer):
    class Meta:
        model = DailySchedule
        fields = '__all__'


class TermSettingsSerializer(DynamicModelSerializer):
    schedule = DynamicRelationField('DailyScheduleSerializer')

    class Meta:
        model = TermSettings
        fields = '__all__'


class TermSerializer(DynamicModelSerializer):
    settings = DynamicRelationField('TermSettingsSerializer')
    school_year = DynamicRelationField('SchoolYearSerializer')

    class Meta:
        model = Term
        fields = '__all__'

    def validate(self, data):
        super(TermSerializer, self).validate(data)

        if data['end_date'] < data['start_date']:
            raise serializers.ValidationError("A semester cannot end before it starts!")
        return data


class HolidaySerializer(DynamicModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'

    def validate(self, data):
        if data['end_date'] < data['start_date']:
            raise serializers.ValidationError("A semester cannot end before it starts!")
        return data

    school_year = DynamicRelationField('SchoolYearSerializer')


class SectionSerializer(DynamicModelSerializer):
    class Meta:
        model = Section
        fields = '__all__'
    teacher = DynamicRelationField('SproutUserSerializer')


class EnrollmentSerializer(DynamicModelSerializer):
    class Meta:
        model = Enrollment
        fields = ('id', 'section', 'student')

    def update(self, instance, validated_data):
        """
        Clean up notifications for a teacher when a student's enrollment changes
        """
        old_student = instance.student
        old_teacher = instance.section.teacher
        old_notifications = Notification.objects.filter(student=old_student, user=old_teacher)
        for notification in old_notifications:
            notification.delete()
        return super(EnrollmentSerializer, self).update(instance, validated_data)

    section = DynamicRelationField('SectionSerializer')
    student = DynamicRelationField('StudentSerializer')


class BehaviorSerializer(DynamicModelSerializer):
    class Meta:
        model = Behavior
        fields = ('id', 'enrollment', 'date', 'behavior', 'effort')
    enrollment = DynamicRelationField('EnrollmentSerializer')


class AttendanceRecordSerializer(DynamicModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = '__all__'
    enrollment = DynamicRelationField('EnrollmentSerializer')


class StandardizedTestSerializer(DynamicModelSerializer):
    class Meta:
        model = StandardizedTest
        fields = ('id', 'test_name', 'min_score', 'max_score',)


class StandardizedTestScoreSerializer(DynamicModelSerializer):
    class Meta:
        model = StandardizedTestScore
        fields = ('id', 'standardized_test', 'student', 'date', 'score',)

    def validate(self, data):
        """
        Run the default validators, then ensure the score is in-range for the related test
        :return: data, but validated
        """
        validated_data = super(StandardizedTestScoreSerializer, self).validate(data)
        if 'score' in validated_data:
            # Make sure the score is not out of range
            if 'standardized_test' in validated_data:
                test = validated_data['standardized_test']
            else:
                test = self.instance.standardized_test
            min_score = test.min_score
            max_score = test.max_score
            score = validated_data['score']
            if score < min_score or score > max_score:
                raise serializers.ValidationError({'score': 'Out of range for test with id {id}'.format(id=test.id)})
        return validated_data

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

    def validate(self, data):
        """
        Run the default validators, then:
            ensure the score is in-range for the related test
            ensure the student is enrolled in the class to which the assignment belongs

        :return: data, but validated
        """
        validated_data = super(GradeSerializer, self).validate(data)

        if 'assignment' in validated_data:
            assignment = validated_data['assignment']
        else:
            assignment = self.instance.assignment

        if 'score' in validated_data:
            # Make sure the score is not out of range
            score = validated_data['score']
            if score < assignment.score_min or score > assignment.score_max:
                raise serializers.ValidationError({'score': 'Out of range for assignment with id {id}'.format(id=assignment.id)})

        # Check that the student is enrolled in the class to which the assignment belongs
        section = assignment.section
        student = validated_data['student']
        try:
            Enrollment.objects.get(section=section, student=student)
        except Enrollment.DoesNotExist:
            raise serializers.ValidationError({'student': 'This student is not enrolled in section with id {id}'.format(id=section.id)})
        return validated_data

    assignment = DynamicRelationField('AssignmentSerializer')
    student = DynamicRelationField('StudentSerializer')


class SproutLoginSerializer(LoginSerializer):
    username = None
    email = serializers.EmailField(required=True)


class SproutRegisterSerializer(RegisterSerializer):
    username = None
    first_name = serializers.CharField(source='sproutuserprofile.first_name')
    last_name = serializers.CharField(source='sproutuserprofile.last_name')
    password1 = serializers.CharField(write_only=True, required=False)
    password2 = serializers.CharField(write_only=True, required=False)

    def custom_signup(self, request, user):
        profile_data = self.validated_data.pop('sproutuserprofile', {})
        first_name = profile_data.get('first_name')
        last_name = profile_data.get('last_name')
        profile = SproutUserProfile(user=user, first_name=first_name, last_name=last_name)
        profile.save()
        self.instance = user

    def to_representation(self, instance):
        representation = super(SproutRegisterSerializer, self).to_representation(instance)
        representation['active'] = instance.is_active
        user_profile = {'first_name' : instance.sproutuserprofile.first_name,
                        'last_name' : instance.sproutuserprofile.last_name,
                        }
        representation['sproutuserprofile'] = user_profile
        return representation

    def validate(self, data):
        """
        Allow the password fields to be left off
        """
        if 'password1' in data or 'password2' in data:
            if not ('password1' in data and 'password2' in data):
                raise serializers.ValidationError(_("Both password fields must be provided if one is"))
            if data['password1'] != data['password2']:
                raise serializers.ValidationError(_("The two password fields didn't match."))
        return data

    def get_cleaned_data(self):
        """
        Allow the password fields to be left off
        """
        to_return = {
            'username': self.validated_data.get('username', ''),
            'email': self.validated_data.get('email', '')
        }
        if 'password1' in self.validated_data:
            to_return['password1'] = self.validated_data.get('password1', '')
        return to_return

    class Meta:
        fields = ('email', )


class SproutUserSerializer(WithDynamicModelSerializerMixin, UserDetailsSerializer):
    first_name = serializers.CharField(source='sproutuserprofile.first_name')
    last_name = serializers.CharField(source='sproutuserprofile.last_name')

    class Meta(UserDetailsSerializer.Meta):
        fields = []
        fields.extend(UserDetailsSerializer.Meta.fields)
        fields.extend(('first_name', 'last_name', 'is_active'))
        if 'username' in fields:
            del fields[fields.index('username')]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('sproutuserprofile', {})
        first_name = profile_data.get('first_name')
        last_name = profile_data.get('last_name')

        instance = super(SproutUserSerializer, self).update(instance, validated_data)
        try:
            profile = instance.sproutuserprofile
        except SproutUserProfile.DoesNotExist:
            # Try/Catch should not be necessary because the user profile should never not exist
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
        fields = '__all__'
    user = DynamicRelationField('SproutUserSerializer')
    student = DynamicRelationField('StudentSerializer')


class FocusStudentSerializer(DynamicModelSerializer):
    class Meta:
        model = FocusStudent
        fields = ('id', 'student', 'user', 'ordering', 'focus_category', 'progress_category', 'caution_category', )
    user = DynamicRelationField('SproutUserSerializer')
    student = DynamicRelationField('StudentSerializer')

    def to_representation(self, instance):
        representation = super(FocusStudentSerializer, self).to_representation(instance)

        # Get the Sprout-generated categories
        student = representation['student']
        grades = Grade.objects.filter(student=student)
        attendances = AttendanceRecord.objects.filter(enrollment__student=student) # Attendances not currently tracked by Sprout
        behavior_efforts = Behavior.objects.filter(enrollment__student=student)
        test_scores = StandardizedTestScore.objects.filter(student=student)
        calculator = CategoryCalculator(student=student, grades=grades, attendances=attendances, behavior_efforts=behavior_efforts,
                                        test_scores=test_scores)
        progress = calculator.get_progress_category()
        caution = calculator.get_caution_category()
        focus = calculator.prepare_focus_category(representation['focus_category'])
        representation['progress_category'] = progress
        representation['caution_category'] = caution
        representation['focus_category'] = focus
        return representation


class IEPGoalSerializer(DynamicModelSerializer):
    class Meta:
        model = IEPGoal
        fields = '__all__'

    def validate(self, data):
        """
        Ensure that the quantitative range is non-empty and that
        the quantitative target is within the range
        """
        if 'quantitative_range_low' in data:
            lower_bound = data['quantitative_range_low']
        else:
            lower_bound = getattr(self.instance, 'quantitative_range_low', None)

        if 'quantitative_range_upper' in data:
            upper_bound = data['quantitative_range_upper']
        else:
            upper_bound = getattr(self.instance, 'quantitative_range_upper', None)

        if 'quantitative_target' in data:
            target = data['quantitative_target']
        else:
            target = getattr(self.instance, 'quantitative_target', None)

        if lower_bound is not None or upper_bound is not None:
            if lower_bound is None or upper_bound is None:
                raise serializers.ValidationError('If one part of the quantitative range is defined, both must be')
            if upper_bound < lower_bound:
                raise serializers.ValidationError('The upper bound of the quantitative range must not be below the lower bound of the range')
            if target is not None:
                if target < lower_bound or target > upper_bound:
                    raise serializers.ValidationError("Goal target must be within the lower and upper bounds of the range")
        elif target is not None:
            raise serializers.ValidationError("Does not make sense to declare a target without a range")

        return data

    student = DynamicRelationField('StudentSerializer')


class IEPGoalDatapointSerializer(DynamicModelSerializer):
    class Meta:
        model = IEPGoalDatapoint
        fields = '__all__'
    goal = DynamicRelationField('IEPGoalSerializer')


class IEPGoalNoteSerializer(DynamicModelSerializer):
    class Meta:
        model = IEPGoalNote
        fields = '__all__'
    goal = DynamicRelationField('IEPGoalSerializer')


class ServiceRequirementSerializer(DynamicModelSerializer):
    student = DynamicRelationField('StudentSerializer')
    fulfilled_user = DynamicRelationField('SproutUserSerializer')

    class Meta:
        model = ServiceRequirement
        fields = '__all__'

    def validate(self, data):
        """
        Ensure that if the service has been marked as fulfilled that the
        other fulfilled fields are filled

        :param fulfilled: Whether the service has been fulfilled
        :return:
        """
        data = super(ServiceRequirementSerializer, self).validate(data)
        if 'fulfilled' in data:
            fulfilled = data['fulfilled']
        else:
            fulfilled = self.instance.fulfilled
        if fulfilled:
            errors = {}
            for field in 'fulfilled_date', 'fulfilled_user', 'fulfilled_description':
                if (not field in data) and getattr(self.instance, field, None) is None:
                    errors[field] = ['Required if this service is fulfilled']
            if len(errors) > 0:
                raise serializers.ValidationError(errors)

        return data
