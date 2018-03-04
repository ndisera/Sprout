#!/usr/bin/env python2

import datetime
import os
import random

from services.student import Student, StudentService

from services.services import ServiceRequirement, ServiceService

class ServiceGenerator(object):
    """IEPGenerator contains various methods for generating IEP data

    This uses the Sprout Backend API. As such, the backend needs to be running before these
    scripts can do anything
    """

    CERT_PATH = os.path.dirname(os.path.realpath(__file__))

    SERVICE_TITLE_TEMPLATES = ["Meet with the school psychologist 30 minutes per week",
                                     "Get specialized {} tutoring 30 minutes per day"]
    SERVICE_SUBJECTS = ["math", "science", "reading"]

    def __init__(self, headers=None, protocol='https', hostname="localhost", port_num=8000, verify=False):
        self.studentService = StudentService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)
        self.serviceService = ServiceService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)

    def generate_many_random_services(self,
                                       num,
                                       fulfilled_chance = 0.5,
                                      ):
        """
        Generate the specified number of IEPGoals for each student in the database

        :param num: Number of IEP Goals to generate for each student
        :param fulfilled_chance: Chance that a service has been fulfilled
        :param duedate_range_start:
        :param duedate_range_end:
        :return: Dictionary of student_id -> List of IEPGoals
        """
        to_return = {}

        students = self.studentService.get_students()

        for student in students:
            service_requirements = []
            for i in range(num):
                # Generate a randomly assembled title
                title = random.choice(self.SERVICE_TITLE_TEMPLATES).format(
                    random.choice(self.SERVICE_SUBJECTS)
                )

                description = "{first_name} needs to {title}".format(
                    first_name=student.first_name,
                    title=(lambda s: s[:1].lower() + s[1:])(title), # Append the title, but with the first letter lower-case
                )

                # Decide whether this goal shall be quantitative
                fulfilled = random.random() < fulfilled_chance
                fulfilled_date = None
                fulfilled_user = None
                fulfilled_description = None
                if fulfilled:
                    fulfilled_date = datetime.datetime.now() - datetime.timedelta(random.randint(0, 100))
                    fulfilled_date = str(fulfilled_date.date())
                    fulfilled_user = student.case_manager
                    fulfilled_description = "{first_name} will {title} in their schedule".format(
                        first_name=student.first_name,
                        title=(lambda s: s[:1].lower() + s[1:])(title), # Append the title, but with the first letter lower-case
                    )


                goal = ServiceRequirement(
                    student=student.id,
                    title=title,
                    description=description,
                    fulfilled=fulfilled,
                    fulfilled_date=fulfilled_date,
                    fulfilled_user=fulfilled_user,
                    fulfilled_description=fulfilled_description,
                )
                service_requirements.append(goal)
            to_return[student.id] = service_requirements
        return to_return
