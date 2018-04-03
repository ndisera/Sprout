
from django.db import models

from django.contrib.auth.models import AbstractBaseUser
from django.contrib.auth.models import BaseUserManager

from django.conf import settings


class SproutUserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """
        Creates and saves a SproutUser with the given email and password.
        """
        if not email:
            raise ValueError('The given email must be set')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class SproutUser(AbstractBaseUser):
    """
    SproutUser
    Represent and store the account information of anyone who uses Sprout
    """
    email = models.EmailField(unique=True, blank=False)
    is_superuser = models.BooleanField(default=False,
                                       help_text="Whether this user should have all permissions")
    is_staff = models.BooleanField(default=False,
                                   help_text="Not used")
    is_active = models.BooleanField(default=True,
                                    help_text="Whether this account is active or not")

    EMAIL_FIELD = 'email'
    USERNAME_FIELD = AbstractBaseUser.get_email_field_name()

    objects = SproutUserManager()

    def __str__(self):
        return self.__getattribute__(AbstractBaseUser.get_email_field_name())

    @staticmethod
    def has_write_permission(request):
        """
        Block normal users from modifying/creating users
        """
        user = request.user
        return user.is_superuser

    def has_object_write_permission(self, request):
        return SproutUser.has_write_permission(request)

    def has_object_update_permission(self, request):
        """
        Block normal users from modifying users other than themselves
        """
        user = request.user
        if self == user:
            return True
        return user.is_superuser

    def has_object_read_permission(self, request):
        """
        Any (authenticated) user can read all other user's basic information
        """
        user = request.user

        return user.is_authenticated
