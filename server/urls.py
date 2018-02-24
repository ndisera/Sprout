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
from rest_framework.documentation import include_docs_urls
from rest_framework.schemas import get_schema_view
from rest_framework_swagger.views import get_swagger_view
from api.routers import NestedDynamicRouter
from api.views import *

router = NestedDynamicRouter()
router.register('behaviors', viewset=BehaviorViewSet, base_name='Behaviors')
router.register('enrollments', viewset=EnrollmentViewSet, base_name='Enrollments')
router.register('holidays', viewset=HolidayViewSet, base_name='holidays')
sections_router = router.register('sections', viewset=SectionViewSet, base_name='Sections')
router.register('tests/standardized', viewset=StandardizedTestViewSet, base_name='StandardizedTests')
router.register('standardized_test_scores', viewset=StandardizedTestScoreViewSet, base_name='StandardizedTestScores')
students_router = router.register('students', viewset=StudentViewSet, base_name='Students')
router.register('terms', viewset=TermViewSet, base_name='terms')
users_router = router.register('users', viewset=SproutUserViewSet, base_name="Users")

# Add nested route for assignments as /sections/{pk}/assignments
assignments_router = sections_router.register('assignments', viewset=AssignmentViewSet, base_name='section-assignments', parents_query_lookups=['section'])

# Add nested route for grades as /sections/{pk}/assignments/{pk}/grades
assignments_router.register('grades', viewset=GradeViewSet, base_name='assignment-grades', parents_query_lookups=['assignment__section', 'assignment'])

# Add nested routes under students
# Add nested route for grades as /student/{pk}/grades
students_router.register('grades', viewset=GradeViewSet, base_name='student-grades', parents_query_lookups=['student'])
# Add nested route for IEPs as /student/{pk}/ieps
iep_router = students_router.register('ieps', viewset=IEPGoalViewSet, base_name='student-ieps', parents_query_lookups=['student'])
# Add nested route for services as /student/{pk}/services
students_router.register('services', viewset=ServiceRequirementViewSet, base_name='student-services', parents_query_lookups=['student'])

# Add nested routes for iep notes as /student/{pk}/ieps/{pk}/notes
iep_router.register('notes', viewset=IEPGoalNoteViewSet, base_name='iep-notes', parents_query_lookups=['goal__student', 'goal'])

# Add nested route for notifications as /users/{pk}/notifications
users_router.register('notifications', viewset=NotificationViewSet, base_name='users-notifications', parents_query_lookups=['user'])
users_router.register('focus', viewset=FocusStudentViewSet, base_name='users-focus', parents_query_lookups=['user'])

urlpatterns = router.urls

urlpatterns.append(url(r'^docs/', include_docs_urls(title='Sprout API', public=False)))
urlpatterns.append(url(r'^swagger/', get_swagger_view(title='Sprout API')))
urlpatterns.append(url(r'^schema/', get_schema_view(title='Sprout Schema')))

# URL Patterns for token authentication setup
urlpatterns.append(url(r'^', include('rest_auth.urls')))
urlpatterns.append(url(r'^registration/', include('rest_auth.registration.urls')))
urlpatterns.append(url(r'^auth-verify/', view=AuthVerifyView.as_view(), name="auth-verify"))
