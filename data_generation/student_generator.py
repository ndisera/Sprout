import datetime
import json
import random
import requests

class StudentGenerator(object):
    """StudentGenerator contains various methods for generating student data

    This uses the Sprout BackEnd API. As such, the BackEnd needs to be running before these
    scripts can do anything
    """

    def __init__(self, url="http://localhost", port_num=8000):
        self.url = url
        self.port_num = port_num
        self.url_port = str(self.url) + ":" + str(self.port_num) + "/student/"

    def upload_random_student(self,
                              first_names,
                              last_names,
                              birthdate_range_start=datetime.date(2006, 9, 1),
                              birthdate_range_end=datetime.date(2008, 9, 1)):
        """Generate and upload a random student based on the passed parameters

        :param first_names:
        :type first_names: list of strings
        :param last_names:
        :type last_names: list of strings
        :param birthdate_range_start:
        :type birthdate_range_start: datetime.date
        :param birthdate_range_end:
        :type birthdate_range_end: datetime.date
        :return:
        """
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)

        date_range_size = birthdate_range_end - birthdate_range_start

        random_date_delta = random.randint(0, date_range_size.days)

        birthdate = birthdate_range_start + datetime.timedelta(random_date_delta)

        self.upload_student(first_name, last_name, birthdate)


    def upload_developer_information(self):
        self.upload_student(first_name="Nico",
                            last_name="DiSera",
                            birthdate=datetime.date(year=1996, month=5, day=20))

        self.upload_student(first_name="Simon",
                            last_name="Redman",
                            birthdate=datetime.date(year=1995, month=1, day=18))

        self.upload_student(first_name="Guy",
                            last_name="Watson",
                            birthdate=datetime.date(year=1752, month=8, day=7))

        self.upload_student(first_name="Graham",
                            last_name="Zuber",
                            birthdate=datetime.date(year=1989, month=9, day=18))

    def upload_student(self, first_name, last_name, birthdate):
        """Upload a single student to the server

        :param first_name: First name of the student
        :type first_name: str
        :param last_name: Last name of the student
        :type last_name: str
        :param birthdate: Student's birthday
        :type birthdate: datetime.date
        :return:
        """
        json = {"first_name":first_name,
                "last_name":last_name,
                "birthdate":str(birthdate)}
        response = requests.post(url=self.url_port, json=json)

        if response.status_code >= 400 and response.status_code < 500:
            raise "Unable to POST student: " + str(json)


if __name__ == "__main__":
    generator = StudentGenerator()
    generator.upload_developer_information()
    generator.upload_random_student(["simon", "guy"], ["watson", "redman"])