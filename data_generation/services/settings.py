from base_service import BaseService

from collections import namedtuple

SchoolSettings = namedtuple("SchoolSettings", ['id', 'school_name', 'school_location', ])
DailySchedule = namedtuple("DailySchedule", ['id', 'name', 'total_periods', 'periods_per_day', ])
TermSettings  = namedtuple("TermSettings", ['id', 'schedule', ])


class SettingsService(BaseService):

    def __init__(self, **kwargs):
        super(SettingsService, self).__init__(**kwargs)
        self.complete_uri_school = self.complete_uri_template.format(endpoint="/settings/school")
        self.complete_uri_schedules = self.complete_uri_template.format(endpoint="/settings/schedules")
        self.complete_uri_term_settings = self.complete_uri_template.format(endpoint="/settings/terms")

    def get_school(self):
        """
        Get the settings object for the school

        :return:
        """
        return self._get_models(SchoolSettings, self.complete_uri_school)

    def get_schedules(self):
        """
        Get all schedules defined in the school
        """
        return self._get_models(DailySchedule, self.complete_uri_schedules)

    def get_term_settings(self):
        """
        Get all term_settings defined in the school
        """
        return self._get_models(TermSettings, self.complete_uri_term_settings)

    def add_school(self, school):
        return self._add_many_models([school], self.complete_uri_school)

    def add_schedule(self, schedule):
        return self.add_many_schedules([schedule])

    def add_many_schedules(self, schedules):
        return self._add_many_models(schedules, self.complete_uri_schedules)

    def add_term_settings(self, term_settings):
        return self.add_many_schedules([term_settings])

    def add_many_term_settings(self, term_settings):
        return self._add_many_models(term_settings, self.complete_uri_schedules)
