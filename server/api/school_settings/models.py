
from django.db import models
from django.conf import settings


class SchoolSettings(models.Model):
    """
    SchoolSettings
    Represent and save everything a school might want to customize
    TODO: Use a singleton model: https://github.com/lazybird/django-solo
    """
    school_name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                   default="School of Hard Knocks",
                                   help_text="Name of the school")
    school_location = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                                       default="101 Eazy Street",
                                       help_text="Real-world location of the school")


class DailySchedule(models.Model):
    """
    DailySchedule
    Represent how many classes are in a day and how many different 'kinds' of day there are
    """
    name = models.CharField(unique=True, blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                            help_text="Human-readable name of this schedule")
    total_periods = models.IntegerField(blank=False,
                                        help_text="Total number of classes a student should have in their schedule")
    periods_per_day = models.FloatField(blank=False,
                                        help_text="Number of classes a student should visit per day")


class TermSettings(models.Model):
    """
    TermSettings
    Represent everything relevant to a Term, such as when classes start and end

    This might (and should) be used in a many-to-one relationship with many Term objects to a single TermSettings object
    """
    schedule = models.ForeignKey(DailySchedule,
                                 help_text="Schedule used in this term")


class Term(models.Model):
    """
    Term
    Represent a school term, such as a particular semester, quarter, etc.
    """
    name = models.CharField(blank=False, max_length=settings.DEFAULT_MAX_CHARFIELD_LENGTH,
                            help_text="Term name, such as \"Fall\" or \"First Quarter\"")
    start_date = models.DateField(blank=False,
                                  help_text="Term start date, such as 2018-01-18 for the 18th of January, 2018")
    end_date = models.DateField(blank=False,
                                help_text="Term end date")
    settings = models.ForeignKey(TermSettings, blank=False, on_delete=models.PROTECT,
                                 help_text="Settings controlling this Term")
