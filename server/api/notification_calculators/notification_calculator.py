
from datetime import datetime, timedelta
from collections import namedtuple
from sklearn import svm
import numpy as np
import pandas as pd


# See help_text on fields of api.models.Notification for descriptions of these fields
Notification = namedtuple('Notification', ['title', 'body', 'date', 'student'])


class AbstractNotificationCalculator:

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
        self.behavior_efforts = behavior_efforts
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
        An instance of this class will be created, and get_notifications will be called
    """

    # TODO: importer will wipe grades every time, regenerating notifications. Implement if/when this is fixed

    def get_notifications(self, grade):
        """
        Get notifications, if any, relating to this grade object

        :param grade: The just-saved grade object. Might be in self.grades if a grade is being updated
        :return: List of Notification objects, empty list if nothing interesting is discovered
        """
        # Return an empty list, signaling that no notifications were generated
        to_return = []

        return to_return


class BehaviorNotificationCalculator(AbstractNotificationCalculator):
    """
    Everything necessary to calculate a notification

    This class will be used as follows:
        A request will be made to the backend to save a behavior record
            If a behavior is being updated, it might be included in the list passed to the constructor
        An instance of this class will be created, and get_notifications will be called
    """
    #tag: current development

    # create a machine learning model using at least 20 examples from the student's behavior/effort scores in the past
    # two months. Then predict the student's three most recent behavior/effort scores. If we're off by more than 1 for
    # all three in the same direction, trigger a notification
    # Do this for all of the student's classes

    def get_notifications(self, new_behavior):
        """
        Get notifications, if any, relating to this behavior object

        :param new_behavior: The just-saved behavior object. Might be in self.behaviors if a behavior is being updated
        :return: List of Notification objects, empty list if nothing interesting is discovered
        """
        to_return = []

        # https://stackoverflow.com/a/4143837/3518046
        # only save a list if it's the same class as the new behavior score
        behavior_effort_list = {}
        for behavior in self.behavior_efforts:
            if behavior.enrollment_id == new_behavior.enrollment_id:
                behavior_effort_list.setdefault(behavior.enrollment_id, []).append(behavior)
        # We should only ever have one list
        behavior_effort_list = behavior_effort_list[new_behavior.enrollment_id]

        # extract the data
        dates = [score.date for score in behavior_effort_list]
        date_offsets = [(current_date - datetime.now().date()).days for current_date in dates]
        dates_index = pd.Index(data=date_offsets)

        behaviors = [score.behavior for score in behavior_effort_list]
        behaviors_series = pd.Series(data=behaviors, index=dates_index)
        efforts = [score.effort for score in behavior_effort_list]
        efforts_series = pd.Series(data=efforts, index=dates_index)

        # Save the lookup
        class_title = new_behavior.enrollment.section.title

        # make new dataframes, fill them, and add them to a list
        behavior_df = pd.DataFrame(data=behaviors_series, index=dates_index)
        effort_df = pd.DataFrame(data=efforts_series, index=dates_index)

        # Separate into train and predict
        b_train_data = behavior_df[0][:-3]
        b_test_data  = behavior_df[0][-3:]
        e_train_data = effort_df[0][:-3]
        e_test_data  = effort_df[0][-3:]



        # machine learnin'
        b_clf = svm.OneClassSVM(nu=0.1, kernel='rbf', gamma=0.1)
        b_clf.fit(b_train_data.reshape(-1, 1))
        b_prediction_data = b_clf.predict(b_test_data.reshape(-1, 1))

        e_clf = svm.OneClassSVM(nu=0.1, kernel='rbf', gamma=0.1)
        e_clf.fit(e_train_data.reshape(-1, 1))
        e_prediction_data = b_clf.predict(e_test_data.reshape(-1, 1))

        # 1 means expected, -1 means this is an abnormality

        # if the majority are abnormalities, trigger a notification
        if sum(b_prediction_data) < 0:
            title = "Abnormal Behavior Scores"
            body = "Sprout has noticed an abnormal pattern of recent behavior scores for " + \
                   new_behavior.enrollment.student.first_name + " " + new_behavior.enrollment.student.last_name + "."
            date = new_behavior.date
            student = new_behavior.enrollment.student.id
            notification = Notification(title, body, date, student)
            to_return.append(notification)

        if sum(e_prediction_data) < 0:
            title = "Abnormal Effort Scores"
            body = "Sprout has noticed an abnormal pattern of recent effort scores for " + \
                   new_behavior.enrollment.student.first_name + " " + new_behavior.enrollment.student.last_name + "."
            date = new_behavior.date
            student = new_behavior.enrollment.student.id
            notification = Notification(title, body, date, student)
            to_return.append(notification)

        # raise NotImplemented  # just because I can, and this mean I don't have to keep editing my behaviors every time
        return to_return


class TestScoreNotificationCalculator(AbstractNotificationCalculator):
    """
    Everything necessary to calculate a notification

    This class will be used as follows:
        A request will be made to the backend to save a test score record
            If a test score is being updated, it might be included in the list passed to the constructor
        An instance of this class will be created, and get_notifications will be called
    """

    def get_notifications(self, score):
        """
        Get notifications, if any, relating to this behavior object

        :param score: The just-saved behavior object. Might be in self.behaviors if a behavior is being updated
        :return: List of Notification objects, empty list if nothing interesting is discovered
        """
        to_return = []

        return to_return


class AttendanceRecordNotificationCalculator(AbstractNotificationCalculator):
    """
    Everything necessary to calculate a notification

    This class will be used as follows:
        A request will be made to the backend to save an attendance record
            If a attendance is being updated, it might be included in the list passed to the constructor
        An instance of this class will be created, and get_notifications will be called
    """

    def get_notifications(self, score):
        """
        Get notifications, if any, relating to this behavior object

        :param score: The just-saved behavior object. Might be in self.behaviors if a behavior is being updated
        :return: List of Notification objects, empty list if nothing interesting is discovered
        """
        to_return = []

        return to_return
