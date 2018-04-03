#!/usr/bin/env python2

import datetime
import os
import random

from lib.services.student import Student, StudentService
from lib.services.services import ServiceRequirement, ServiceService

import lib.constants as constants

class ServiceGenerator(object):
    """IEPGenerator contains various methods for generating IEP data

    This uses the Sprout Backend API. As such, the backend needs to be running before these
    scripts can do anything
    """

    CERT_PATH = os.path.dirname(os.path.realpath(__file__))

    SERVICE_TITLE_TEMPLATE = "Service type {type}"
    SERVICE_BODY_TEMPLATE = "This student should get special {type} service"

    def __init__(self, headers=None, protocol='https', hostname="localhost", port_num=8000, verify=False):
        self.studentService = StudentService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)
        self.serviceService = ServiceService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)

    def generate_many_random_services(self,
                                       num,
                                       fulfilled_chance = 0.5,
                                      ):
        """
        Generate the specified number of ServiceRequirements for each student in the database

        :param num: Number of Services to generate for each student
        :param fulfilled_chance: Chance that a service has been fulfilled
        :return: Dictionary of student_id -> List of Services
        """
        to_return = {}

        students = self.studentService.get_students()

        for student in students:
            service_requirements = []
            for i in range(num):

                # Select a type
                type_val, type_name = random.choice(constants.ServiceType.choices())
                type_val = int(type_val)

                type_name = type_name.replace('_', ' ')
                type_name = type_name.lower()

                # Build a title from the type. There is massive room for improvement
                title = self.SERVICE_TITLE_TEMPLATE.format(type=type_name)
                description = self.SERVICE_BODY_TEMPLATE.format(type=type_name)

                # Decide whether this service shall be fulfilled
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

                service = ServiceRequirement(
                    student=student.id,
                    title=title,
                    description=description,
                    fulfilled=fulfilled,
                    fulfilled_date=fulfilled_date,
                    fulfilled_user=fulfilled_user,
                    fulfilled_description=fulfilled_description,
                    type=type_val,
                )
                service_requirements.append(service)
            to_return[student.id] = service_requirements
        return to_return
