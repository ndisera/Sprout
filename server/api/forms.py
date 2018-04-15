
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import PasswordResetForm

UserModel = get_user_model()

class SproutPasswordResetForm(PasswordResetForm):

    def get_users(self, email):
        """
        Same goal as super.get_users, but doesn't ignore users with unusable passwords
        """
        active_users = UserModel._default_manager.filter(**{
            '%s__iexact' % UserModel.get_email_field_name(): email,
            'is_active': True,
        })
        return (u for u in active_users)