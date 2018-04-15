
from collections import namedtuple

# See help_text on fields of api.models.Notification for descriptions of these fields
Notification = namedtuple('Notification', ['title', 'body', 'date', 'student'])

class AbstractNotificationCalculator():

    def __init__(self, student, grades, attendances, behavior_efforts, test_scores):
        """
        Construct a CategoryCalculator, storing all relevant datalists for future use

        :param student: api.models.Student object who is being graded
        :param grades: All grades to-date which might include the grade being calculated if it is being updated
        All other parameters are QuerySets of the corresponding models in the database related to the graded student
        """
        self.student = student
        self.grades = grades
        self.attendances = attendances
        self.behavior_effort = behavior_efforts
        self.test_scores = test_scores

    def get_notifications(self, thing):
        """
        Get notifications, if any, relating to this object. This method should be overridden in a subclass

        :param thing: The just-saved object
        :return: List of Notification objects, empty list if nothing interesting is discovered
        """
        raise NotImplemented


class GradeNotificationCalculator(AbstractNotificationCalculator):
    """
    Everything necessary to calculate a notification

    This class will be used as follows:
        A request will be made to the backend to save a grade record
            If a grade is being updated, it might be included in the list passed to the constructor
        Otherwise, an instance of this class will be created, and:
            get_notifications will be called
    """

    def get_notifications(self, grade):
        """
        Get notifications, if any, relating to this grade object

        :param grade: The just-saved grade object. Might be in self.grades if a grade is being updated
        :return: List of Notification objects, empty list if nothing interesting is discovered
        """
        to_return = []

        return to_return


class BehaviorNotificationCalculator(AbstractNotificationCalculator):
    """
    Everything necessary to calculate a notification

    This class will be used as follows:
        A request will be made to the backend to save a grade record
            If a grade is being updated, it might be included in the list passed to the constructor
        Otherwise, an instance of this class will be created, and:
            get_notifications will be called
    """

    def get_notifications(self, behavior):
        """
        Get notifications, if any, relating to this behavior object

        :param behavior: The just-saved behavior object. Might be in self.behaviors if a behavior is being updated
        :return: List of Notification objects, empty list if nothing interesting is discovered
        """
        to_return = []

        return to_return


class TestScoreNotificationCalculator(AbstractNotificationCalculator):
    """
    Everything necessary to calculate a notification

    This class will be used as follows:
        A request will be made to the backend to save a grade record
            If a grade is being updated, it might be included in the list passed to the constructor
        Otherwise, an instance of this class will be created, and:
            get_notifications will be called
    """

    def get_notifications(self, score):
        """
        Get notifications, if any, relating to this behavior object

        :param score: The just-saved behavior object. Might be in self.behaviors if a behavior is being updated
        :return: List of Notification objects, empty list if nothing interesting is discovered
        """
        to_return = []

        return to_return