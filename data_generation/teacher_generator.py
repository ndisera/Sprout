
import random

from services.users import User, UsersService

class TeacherGenerator:

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=False,
                 first_names_file="./first_names.txt",
                 last_names_file="./last_names.txt",):
        self.first_names_file=first_names_file
        self.last_names_file=last_names_file

        self.usersService = UsersService(headers=headers, url=url, port_num=port_num, verify=verify)

    def generate_random_teachers(self, num_teachers):
        """
        Generate the specified number of random teachers

        :param num_teachers: Number of teachers to generate
        :return: list[User]
        """
        teachers = []

        with open(self.first_names_file, 'r') as first_names_file:
            with open(self.last_names_file, 'r') as last_names_file:
                first_names = first_names_file.read()
                first_names = first_names.split()
                last_names = last_names_file.read()
                last_names = last_names.split()

                for i in range(0, num_teachers):
                    first_name = random.choice(first_names)
                    last_name = random.choice(last_names)
                    email = "{}{}@{}.{}".format(first_name[0], last_name, "fakeemail", ".edu")
                    teacher = User(
                        email=email,
                        first_name=first_name,
                        last_name=last_name
                    )
                    teachers.append(teacher)
        return teachers

    @staticmethod
    def generate_default_teacher_users():
        """
        Generate two User objects, ready to be uploaded
        :return: list[User]
        """
        teacher_matt = User(
            id=None,
            first_name='Matthew',
            last_name='Flatt',
            email='mflatt@totallyrealemail.edu',
        )

        teacher_danny = User(
            id=None,
            first_name='Daniel',
            last_name='Kopta',
            email='dkopta@totallyrealemail.edu',
        )

        return [teacher_matt, teacher_danny]
