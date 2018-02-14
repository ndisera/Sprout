
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
        if extra_fields.get('first_name') is None:
            raise ValueError('User must have a name')
        if extra_fields.get('last_name') is None:
            raise ValueError('User must have a name')

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
    first_name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)
    last_name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH)

    EMAIL_FIELD = 'email'
    USERNAME_FIELD = AbstractBaseUser.get_email_field_name()
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = SproutUserManager()

    def __str__(self):
        return self.__getattribute__(AbstractBaseUser.get_email_field_name())