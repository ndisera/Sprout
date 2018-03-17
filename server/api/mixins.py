

class AdminWriteMixin():
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
        return AdminWriteMixin.has_write_permission(request)

    @staticmethod
    def has_read_permission(request):
        return True

    def has_object_read_permission(self, request):
        return AdminWriteMixin.has_read_permission(request)