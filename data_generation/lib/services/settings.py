from base_service import BaseService

from collections import namedtuple

SchoolSettings = namedtuple("SchoolSettings", ['id', 'school_name', 'school_location', 'grade_range_lower', 'grade_range_upper', ])
DailySchedule = namedtuple("DailySchedule", ['id', 'name', 'total_periods', 'periods_per_day', ])
TermSettings  = namedtuple("TermSettings", ['id', 'schedule', ])
SchoolYear = namedtuple("SchoolYear", ['start_date', 'end_date', 'title', 'id', 'import_id'])
SchoolYear.__new__.__defaults__= (None, None, ) # title and id optional


class SettingsService(BaseService):

    def __init__(self, **kwargs):
        super(SettingsService, self).__init__(**kwargs)
        self.complete_uri_school = self.complete_uri_template.format(endpoint="/settings/school")
        self.complete_uri_schedules = self.complete_uri_template.format(endpoint="/settings/schedules")
        self.complete_uri_term_settings = self.complete_uri_template.format(endpoint="/settings/terms")
        self.complete_uri_school_years = self.complete_uri_template.format(endpoint="/settings/years")

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

    def get_school_years(self, params=None):
        """
        Get all the SchoolYear objects for the school, with optional filters

        :param params: dict representing filter_key -> filter_val
        """
        return self._get_models(SchoolYear, self.complete_uri_school_years, params=self._prepare_params(params))

    def add_school(self, school):
        """
        Patch the one-and-only school model (fake-o singleton)
        """
        uri = self.complete_uri_template.format(endpoint="/settings/school/{id}").format(id=school.id)
        return self._patch_model(school, uri)

    def add_schedule(self, schedule):
        return self.add_many_schedules([schedule])

    def add_school_year(self, school_year):
        return self.add_many_school_years([school_year])

    def add_many_schedules(self, schedules):
        return self._add_many_models(schedules, self.complete_uri_schedules)

    def add_term_settings(self, term_settings):
        return self.add_many_term_settings([term_settings])

    def add_many_term_settings(self, term_settings):
        return self._add_many_models(term_settings, self.complete_uri_term_settings)

    def add_many_school_years(self, school_years):
        return self._add_many_models(school_years, self.complete_uri_school_years)
