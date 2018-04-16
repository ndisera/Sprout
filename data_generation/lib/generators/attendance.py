#!/usr/bin/env python2

import datetime
import random

from lib.services.enrollment import EnrollmentService
from lib.services.attendance import AttendanceRecord, AttendanceService
from lib.services.term import TermService, Term
from lib.services.section import SectionService, Section

ATTENDANCE_CODES_DESCS = [
    ('T', 'Tardy'),
    ('A', 'Absent'),
    ('E', 'Extracurricular'),
]


class AttendanceGenerator():

    def __init__(self, headers=None, protocol='https', hostname="localhost", port_num=8000, verify=False):
        self.enrollmentService = EnrollmentService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)
        self.attendanceService = AttendanceService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)
        self.termService = TermService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)
        self.sectionService = SectionService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)

    def parse_enrollments(self, enrollments):
        students = set()
        sections = set()

        for enrollment in enrollments:
            students.add(enrollment.student)
            sections.add(enrollment.section)

        return students, sections

    def generate_attendances(self,
                             chance=0.1,
                             date_range_start=datetime.date.today() - datetime.timedelta(days=100),
                             date_range_end=datetime.date.today() + datetime.timedelta(days=100)):
        """
        Generate an attendance record for each enrollment for each day in the date range,
        with a chance that the student was not present for class

        :param chance: chance that a non-present AttendanceRecord will be generated
        :return: list[AttendanceRecord]
        """
        attendances = []

        enrollments = self.enrollmentService.get_enrollments()
        terms = self.termService.get_terms()
        sections = self.sectionService.get_sections()
        midnight = datetime.time()

        for enrollment in enrollments:

            # Restrict generating to the daterange when the enrollment's section's term is in session
            section = [section for section in sections if section.id == enrollment.section][0]
            term = [term for term in terms if term.id == section.term][0]

            start_date = datetime.datetime.strptime(term.start_date, "%Y-%m-%d").date()
            start_date = max(start_date, date_range_start)

            end_date = datetime.datetime.strptime(term.end_date, "%Y-%m-%d").date()
            end_date = min(end_date, date_range_end)

            num_days = end_date - start_date
            num_days = num_days.days

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
                    id=None,
                )
                attendances.append(record)

        return attendances
