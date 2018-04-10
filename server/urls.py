"""Sprout URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""

from django.conf.urls import url
from django.conf.urls import include
from rest_auth.views import PasswordResetConfirmView
from rest_framework.documentation import include_docs_urls
from rest_framework.schemas import get_schema_view
from rest_framework_swagger.views import get_swagger_view
from api.routers import NestedDynamicRouter
from api.views import *

router = NestedDynamicRouter()
router.register('attendances', viewset=AttendanceRecordViewSet, base_name='attendances')
router.register('behaviors', viewset=BehaviorViewSet, base_name='Behaviors')
router.register('enrollments', viewset=EnrollmentViewSet, base_name='Enrollments')
router.register('holidays', viewset=HolidayViewSet, base_name='holidays')
sections_router = router.register('sections', viewset=SectionViewSet, base_name='Sections')
router.register('services', viewset=ServiceRequirementViewSet, base_name='services')
router.register('tests/standardized', viewset=StandardizedTestViewSet, base_name='StandardizedTests')
router.register('standardized_test_scores', viewset=StandardizedTestScoreViewSet, base_name='StandardizedTestScores')
students_router = router.register('students', viewset=StudentViewSet, base_name='Students')
router.register('terms', viewset=TermViewSet, base_name='terms')
users_router = router.register('users', viewset=SproutUserViewSet, base_name="Users")

# Add nested route for assignments as /sections/{pk}/assignments
assignments_router = sections_router.register('assignments', viewset=AssignmentViewSet, base_name='section-assignments', parents_query_lookups=['section'])

# Add nested route for grades as /sections/{pk}/assignments/{pk}/grades
assignments_router.register('grades', viewset=GradeViewSet, base_name='assignment-grades', parents_query_lookups=['assignment__section', 'assignment'])

# Add 'nested' settings routes
router.register('settings/school', viewset=SchoolSettingsViewSet, base_name='settings-school')
router.register('settings/schedules', viewset=DailyScheduleViewSet, base_name='settings-schedules')
router.register('settings/terms', viewset=TermSettingsViewSet, base_name='settings-terms')
router.register('settings/years', viewset=SchoolYearViewSet, base_name='settings-years')

# Add nested routes under students
# Add nested route for grades as /student/{pk}/grades
students_router.register('grades', viewset=GradeViewSet, base_name='student-grades', parents_query_lookups=['student'])
# Add nested route for IEPs as /student/{pk}/ieps
iep_router = students_router.register('ieps', viewset=IEPGoalViewSet, base_name='student-ieps', parents_query_lookups=['student'])
# Add nested route for services as /student/{pk}/services
students_router.register('services', viewset=ServiceRequirementViewSet, base_name='student-services', parents_query_lookups=['student'])
# Add nested route for student profile pictures as /student/{pk}/picture
students_router.register('picture', viewset=ProfilePictureViewSet, base_name='student-pictures', parents_query_lookups=['student'])
# Add nested route for student behaviors as /student/{pk}/behaviors
students_router.register('behaviors', viewset=BehaviorViewSet, base_name='student-behaviors', parents_query_lookups=['enrollment__student'])
# Add nested route for student behavior notes as /student/{pk}/behavior-notes
students_router.register('behavior-notes', viewset=BehaviorNoteViewSet, base_name='student-behavior-notes', parents_query_lookups=['student'])
# Add nested route for students' parents' contact info as /student/{pk}/parent-contact-info
students_router.register('parent-contact-info', viewset=ParentContactInfoViewSet, base_name='student-parent_contact_info', parents_query_lookups=['student'])
# Add nested route for student final grades as /student/{pk}/final-grades
students_router.register('final-grades', viewset=FinalGradeViewSet, base_name='student-final-grades', parents_query_lookups=['enrollment__student'])

# Add nested routes for iep notes as /student/{pk}/ieps/{pk}/notes
iep_router.register('notes', viewset=IEPGoalNoteViewSet, base_name='iep-notes', parents_query_lookups=['goal__student', 'goal'])
iep_router.register('data', viewset=IEPGoalDatapointViewSet, base_name='iep-data', parents_query_lookups=['goal__student', 'goal'])

# Add nested route for notifications as /users/{pk}/notifications
users_router.register('notifications', viewset=NotificationViewSet, base_name='users-notifications', parents_query_lookups=['user'])
# Add nested route for notifications as /users/{pk}/focus
users_router.register('focus', viewset=FocusStudentViewSet, base_name='users-focus', parents_query_lookups=['user'])
# Add nested route for notifications as /users/{pk}/picture
users_router.register('picture', viewset=ProfilePictureViewSet, base_name='users-picture', parents_query_lookups=['sproutuserprofile'])

urlpatterns = router.urls

urlpatterns.append(url(r'^docs/', include_docs_urls(title='Sprout API', public=False)))
urlpatterns.append(url(r'^swagger/', get_swagger_view(title='Sprout API')))
urlpatterns.append(url(r'^schema/', get_schema_view(title='Sprout Schema')))

# URL Patterns for token authentication setup
urlpatterns.append(url(r'^password/reset/confirm/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$', PasswordResetConfirmView.as_view(),
                       name='rest_password_reset_confirm'))
urlpatterns.append(url(r'^', include('rest_auth.urls')))
urlpatterns.append(url(r'^registration/', include('rest_auth.registration.urls')))
urlpatterns.append(url(r'^auth-verify/', view=AuthVerifyView.as_view(), name="auth-verify"))
