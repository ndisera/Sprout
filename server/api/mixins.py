
from django.db import models

class AuthenticatedUserReadMixin(models.Model):
    """
    Define permissions so that any (authenticated) user has read access
    """

    class Meta:
       abstract = True

    @staticmethod
    def has_read_permission(request):
        return request.user.is_authenticated

    def has_object_read_permission(self, request):
        return self.has_read_permission(request)


class AdminWriteMixin(AuthenticatedUserReadMixin, models.Model):
    """
    Define permissions such that anyone can view but only the admin can create/edit
    """

    class Meta:
       abstract = True

    @staticmethod
    def has_write_permission(request):
        user = request.user
        if user.is_superuser:
            return True
        return False

    def has_object_write_permission(self, request):
        return self.has_write_permission(request)
