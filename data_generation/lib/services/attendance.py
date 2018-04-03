
from collections import namedtuple

from base_service import BaseService

AttendanceRecord = namedtuple("Attendance", ['enrollment', 'date', 'short_code', 'description', 'import_id', 'id', ])
AttendanceRecord.__new__.__defaults__= (None, ) # id is optional

class AttendanceService(BaseService):

    def __init__(self, **kwargs):
        super(AttendanceService, self).__init__(**kwargs)
        self.complete_uri = self.complete_uri_template.format(endpoint="/attendances/")

    def get_attendances(self, params=None):
        """
        Download a complete list of attendances, with optional filters

        :param params: dict representing filter_key -> filter_val
        :return: list of attendance objects
        :rtype: list[AttendanceRecord]
        """
        return self._get_models(AttendanceRecord, self.complete_uri, params=self._prepare_params(params))

    def add_attendance_record(self, attendance_record):
        """
        Upload a behavior object to the server

        :param attendance_record: Behavior object to upload
        :type attendance_record: Behavior
        """
        return self.add_many_attendance_records([attendance_record])

    def add_many_attendance_records(self, attendance_records):
        """
        Upload a list of behavior objects to the server

        :param attendance_records: List of behavior objects
        :return:
        """
        return self._add_many_models(attendance_records, self.complete_uri)
