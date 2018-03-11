"""
Django settings for Sprout project.

Generated by 'django-admin startproject' using Django 1.11.7.

For more information on this file, see
https://docs.djangoproject.com/en/1.11/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.11/ref/settings/
"""

import os
import datetime

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.11/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'shtyity(%o*7qin7l%uymk$ja_&*5kzmvo@f*aruw!ehr1e6$v'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [ 'localhost' ]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    # Requirements for token-based authentication
    'rest_auth',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount', # Not actually needed/wanted, but required to work around a bug in django-rest-auth
    'rest_auth.registration',
    # End requirements for token-based authentication
    # Permissions
    'dry_rest_permissions',
    # End Permissions
    'api',
    'rest_framework_swagger',
    'corsheaders',
    'dynamic_rest',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.11/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.11/howto/static-files/

STATIC_ROOT = os.path.join(BASE_DIR, 'static')
STATIC_URL = '/static/'

# CORS Middleware Configuration
CORS_ORIGIN_ALLOW_ALL = True
CORS_ALLOW_CREDENTIALS = True

# JWT = JSON Web Tokens -- Used for our token-based authentication
# Configure JWT to expire after 18 hours and not be refreshable
JWT_AUTH = {
    'JWT_EXPIRATION_DELTA': datetime.timedelta(hours=18),
    'JWT_ALLOW_REFRESH': False,
}

# Make JWT Auth the default authentication mechanism for Django
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_jwt.authentication.JSONWebTokenAuthentication',
    ),
}

# Enables django-rest-auth to use JWT tokens instead of regular tokens.
REST_USE_JWT = True

SITE_ID = 1

# Tell Swagger to use the JWT authentication
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'api_key': {
            'type': 'apiKey',
            'description': 'Use Sprout\'s token authentication -- Get a token using the Login API below, the paste it here as: "JWT <token>" without quotes',
            'name': 'Authorization',
            'in': 'header'
        }
    },
    'USE_SESSION_AUTH': False,
}

# Enable a custom hasher which automatically scales the number of iterations over time,
# (implicitly) disable all others
PASSWORD_HASHERS = [
    'api.hashers.SproutPBKDF2PasswordHasher'
]

# Email configuration
#EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
EMAIL_HOST = 'localhost'
EMAIL_PORT = 8025
EMAIL_HOST_USER = 'sprout'
EMAIL_HOST_PASSWORD = 'sprout'
EMAIL_USE_TLS = False
EMAIL_USE_SSL = False

# Declare that we are using a custom user object
AUTH_USER_MODEL = 'api.SproutUser'
ACCOUNT_USERNAME_REQUIRED=False
ACCOUNT_USER_MODEL_USERNAME_FIELD=None
ACCOUNT_EMAIL_REQUIRED=True
ACCOUNT_AUTHENTICATION_METHOD='email'

REST_AUTH_SERIALIZERS = {
    'LOGIN_SERIALIZER' :  'api.serializers.SproutLoginSerializer',
    'USER_DETAILS_SERIALIZER' : 'api.serializers.SproutUserSerializer',
}

REST_AUTH_REGISTER_SERIALIZERS = {
    'REGISTER_SERIALIZER' : 'api.serializers.SproutRegisterSerializer',
}

DEFAULT_MAX_CHARFIELD_LENGTH = 100
DESCRIPTION_CHARFIELD_MAX_LENGTH = 1600
