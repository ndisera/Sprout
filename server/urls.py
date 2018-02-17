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
from dynamic_rest.routers import DynamicRouter
from api.routers import NestedDynamicRouter
from api.views import *

router = DynamicRouter()
router.register('behaviors', viewset=BehaviorViewSet, base_name='Behaviors')
router.register('enrollments', viewset=EnrollmentViewSet, base_name='Enrollments')
router.register('notifications', viewset=NotificationViewSet, base_name='Notifications')
router.register('sections', viewset=SectionViewSet, base_name='Sections')
router.register('standardized_tests', viewset=StandardizedTestViewSet, base_name='StandardizedTests')
router.register('standardized_test_scores', viewset=StandardizedTestScoreViewSet, base_name='StandardizedTestScores')
router.register('students', viewset=StudentViewSet, base_name='Students')
router.register('teachers', viewset=TeacherViewSet, base_name='Teachers')
router.register('focus', viewset=FocusStudentViewSet, base_name='FocusStudents')

urlpatterns = router.urls

sections_router = NestedDynamicRouter(router, 'sections', lookup='sections')
sections_router.register('assignments', viewset=AssignmentViewSet, base_name='section-assignments')
assignments_router = NestedDynamicRouter(sections_router, 'assignments', lookup='assignments')
assignments_router.register('grades', viewset=GradeViewSet, base_name='assignment-grades')

urlpatterns.append(url(r'^', include(sections_router.urls)))
urlpatterns.append(url(r'^', include(assignments_router.urls)))

urlpatterns.append(url(r'^docs/', include_docs_urls(title='Sprout API', public=False)))
urlpatterns.append(url(r'^swagger/', get_swagger_view(title='Sprout API')))
urlpatterns.append(url(r'^schema/', get_schema_view(title='Sprout Schema')))

# URL Patterns for token authentication setup
urlpatterns.append(url(r'^', include('rest_auth.urls')))
urlpatterns.append(url(r'^registration/', include('rest_auth.registration.urls')))
urlpatterns.append(url(r'^auth-verify/', view=AuthVerifyView.as_view(), name="auth-verify"))
urlpatterns.append(url(r'^users/', view=SproutUserViewSet.as_view({'get': 'list'}), name="users"))
