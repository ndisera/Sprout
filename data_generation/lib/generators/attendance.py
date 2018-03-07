#!/usr/bin/env python2

import datetime
import random

from lib.services.enrollment import EnrollmentService
from lib.services.attendance import AttendanceRecord, AttendanceService

ATTENDANCE_CODES_DESCS = [
    ('T', 'Tardy'),
    ('A', 'Absent'),
    ('E', 'Extracurricular'),
]


class AttendanceGenerator():

    def __init__(self, headers=None, protocol='https', hostname="localhost", port_num=8000, verify=False):
        self.enrollmentService = EnrollmentService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)
        self.attendanceService = AttendanceService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)

    def parse_enrollments(self, enrollments):
        students = set()
        sections = set()

        for enrollment in enrollments:
            students.add(enrollment.student)
            sections.add(enrollment.section)

        return students, sections

    def generate_attendances(self,
                             chance=0.1,
                             date_range_start=datetime.datetime.now() - datetime.timedelta(days=100),
                             date_range_end=datetime.datetime.now() + datetime.timedelta(days=100)):
        """
        Generate an attendance record for each enrollment for each day in the date range,
        with a chance that the student was not present for class

        :param chance: chance that a non-present AttendanceRecord will be generated
        :return: list[AttendanceRecord]
        """
        attendances = []

        enrollments = self.enrollmentService.get_enrollments()
        midnight = datetime.time()
        start_date = date_range_start.date()
        num_days = date_range_end.date() - start_date
        num_days = num_days.days

        for enrollment in enrollments:
            for day in range(num_days):
                if not random.random() < chance:
                    continue
                date = start_date + datetime.timedelta(days=day)
                short_code, description = random.choice(ATTENDANCE_CODES_DESCS)

                record = AttendanceRecord(
                    enrollment=enrollment.id,
                    date=str(datetime.datetime.combine(date, midnight)),
                    short_code=short_code,
                    description=description,
                )
                attendances.append(record)

        return attendances
