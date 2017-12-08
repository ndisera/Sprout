import datetime
import json
import random
import requests

class StudentGenerator(object):
    """StudentGenerator contains various methods for generating student data

    This uses the Sprout BackEnd API. As such, the BackEnd needs to be running before these
    scripts can do anything
    """

    RANDOM_STUDENT_ID_PREFIX = "gen"

    def __init__(self, url="http://localhost", port_num=8000):
        self.url = url
        self.port_num = port_num
        self.complete_uri = str(self.url) + ":" + str(self.port_num) + "/students/"

    def upload_many_random_students(self,
                                    num_students,
                                    first_names_file="./first_names.txt",
                                    last_names_file="./last_names.txt",
                                    birthdate_range_start=datetime.date(2006, 9, 1),
                                    birthdate_range_end=datetime.date(2008, 9, 1)):
        """Upload a specified number of students by reading first and last names from text files

        :param num_students: Number of students to upload
        :type num_students: int
        :param first_names_file:
        :param last_names_file:
        :param birthdate_range_start:
        :type birthdate_range_start: datetime.date
        :param birthdate_range_end:
        :type birthdate_range_end: datetime.date
        :return: void
        """
        with open(first_names_file, 'r') as first_names_file:
            with open(last_names_file, 'r') as last_names_file:
                first_names = first_names_file.read()
                first_names = first_names.split()
                last_names = last_names_file.read()
                last_names = last_names.split()

                for i in range(0, num_students):
                    self.upload_random_student(first_names,
                                               last_names,
                                               birthdate_range_start,
                                               birthdate_range_end)

    def upload_random_student(self,
                              first_names,
                              last_names,
                              birthdate_range_start=datetime.date(2006, 9, 1),
                              birthdate_range_end=datetime.date(2008, 9, 1)):
        """Generate and upload a random student based on the passed parameters

        :param first_names: List from which to select first names
        :type first_names: list of strings
        :param last_names: List from which to select last names
        :type last_names: list of strings
        :param birthdate_range_start:
        :type birthdate_range_start: datetime.date
        :param birthdate_range_end:
        :type birthdate_range_end: datetime.date
        :return: void
        """
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)

        # Generate a random birthday
        date_range_size = birthdate_range_end - birthdate_range_start
        random_date_delta = random.randint(0, date_range_size.days)
        birthdate = birthdate_range_start + datetime.timedelta(random_date_delta)

        # Generate a random student id
        random_id_number = random.randrange(100000, 999999)
        # If that number turns out to be non-unique, we will be in trouble. Cross your fingers!
        student_id = str(StudentGenerator.RANDOM_STUDENT_ID_PREFIX + str(random_id_number))

        self.upload_student(student_id, first_name, last_name, birthdate)

    def upload_developer_information(self):
        self.upload_student(student_id="dev960520",
                            first_name="Nico",
                            last_name="DiSera",
                            birthdate=datetime.date(year=1996, month=5, day=20))

        self.upload_student(student_id="dev950118",
                            first_name="Simon",
                            last_name="Redman",
                            birthdate=datetime.date(year=1995, month=1, day=18))

        self.upload_student(student_id="dev520807",
                            first_name="Guy",
                            last_name="Watson",
                            birthdate=datetime.date(year=1752, month=8, day=7))

        self.upload_student(student_id="dev890918",
                            first_name="Graham",
                            last_name="Zuber",
                            birthdate=datetime.date(year=1989, month=9, day=18))

    def upload_student(self, student_id, first_name, last_name, birthdate):
        """Upload a single student to the server

        :param student_id: The unique identifier for this student
        :type student_id: str
        :param first_name: First name of the student
        :type first_name: str
        :param last_name: Last name of the student
        :type last_name: str
        :param birthdate: Student's birthday
        :type birthdate: datetime.date
        :return:
        """
        json = {"student_id": student_id,
                "first_name":first_name,
                "last_name":last_name,
                "birthdate":str(birthdate)}
        response = requests.post(url=self.complete_uri, json=json)

        if response.status_code >= 400 and response.status_code < 500:
            raise "Unable to POST student: " + str(json)


if __name__ == "__main__":
    generator = StudentGenerator()
    #generator.upload_developer_information();
    generator.upload_many_random_students(5)