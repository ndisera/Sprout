
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

    def get_notifications(self, new_behavior):
        """
        Get notifications, if any, relating to this behavior object

        :param new_behavior: The just-saved behavior object. Might be in self.behaviors if a behavior is being updated
        :return: List of Notification objects, empty list if nothing interesting is discovered
        """
        to_return = []

        # only consider a datapoint if it's the same class as the new behavior score
        behavior_effort_list = self.behavior_efforts.filter(enrollment_id=new_behavior.enrollment_id).distinct()
        # We should only ever have one list

        # only continue with the learning if we have at least ten examples to train off of, and 3 to test
        training_size = 10
        prediction_size = 3
        if behavior_effort_list.count() < training_size + prediction_size + 1:
            return to_return

        # extract the data
        dates = [score.date for score in behavior_effort_list]
        dates.append(new_behavior.date)
        dates_index = pd.Index(data=dates)

        date_offsets = [(datetime.now().date() - current_date).days for current_date in dates]
        date_offsets_series = pd.Series(data=date_offsets, index=dates_index)

        behaviors = [score.behavior for score in behavior_effort_list]
        behaviors.append(new_behavior.behavior)
        behaviors_series = pd.Series(data=behaviors, index=dates_index)
        efforts = [score.effort for score in behavior_effort_list]
        efforts.append(new_behavior.effort)
        efforts_series = pd.Series(data=efforts, index=dates_index)

        b_combined_series = pd.concat([behaviors_series, date_offsets_series], axis=1)
        e_combined_series = pd.concat([efforts_series, date_offsets_series], axis=1)

        # make new dataframes, fill them, and drop any inequalities
        behavior_df = pd.DataFrame(data=b_combined_series, index=dates_index)
        behavior_df = behavior_df.dropna()
        behavior_df = behavior_df.sort_index()
        effort_df = pd.DataFrame(data=e_combined_series, index=dates_index)
        effort_df = effort_df.dropna()
        effort_df = effort_df.sort_index()


        # Separate into train and predict
        b_train_data = behavior_df[:-prediction_size]
        b_test_data  = behavior_df[-prediction_size:]
        e_train_data = effort_df[:-prediction_size]
        e_test_data  = effort_df[-prediction_size:]


        # machine learnin'
        b_clf = svm.OneClassSVM(nu=0.7, kernel='rbf', gamma='auto')
        b_clf.fit(b_train_data)
        b_prediction_data = b_clf.predict(b_test_data)

        e_clf = svm.OneClassSVM(nu=0.7, kernel='rbf', gamma='auto')
        e_clf.fit(e_train_data)
        e_prediction_data = b_clf.predict(e_test_data)

        # 1 means expected, -1 means this is an abnormality

        # if the last 3 are abnormalities, trigger a notification
        student_name = new_behavior.enrollment.student.first_name + " " + new_behavior.enrollment.student.last_name
        if sum(b_prediction_data) <= -3:
            title = "Abnormal Behavior Scores"
            body = "Sprout has noticed an abnormal pattern of recent behavior scores for " + student_name + "."
            date = str(new_behavior.date)
            student = new_behavior.enrollment.student
            notification = Notification(title, body, date, student)
            to_return.append(notification)

        if sum(e_prediction_data) <= -3:
            title = "Abnormal Effort Scores"
            body = "Sprout has noticed an abnormal pattern of recent effort scores for " + student_name + "."
            date = new_behavior.date
            student = new_behavior.enrollment.student
            notification = Notification(title, body, date, student)
            to_return.append(notification)

        # raise NotImplemented  # use this to not have to edit behaviors everytime for debugging
        return to_return


class TestScoreNotificationCalculator(AbstractNotificationCalculator):
    """
    Everything necessary to calculate a notification

    This class will be used as follows:
        A request will be made to the backend to save a test score record
            If a test score is being updated, it might be included in the list passed to the constructor
        An instance of this class will be created, and get_notifications will be called
    """

    def get_notifications(self, new_score):
        """
        Get notifications, if any, relating to this behavior object

        :param score: The just-saved behavior object. Might be in self.behaviors if a behavior is being updated
        :return: List of Notification objects, empty list if nothing interesting is discovered
        """
        to_return = []

        # only save a list if it's the same class as the new test score
        test_list = self.test_scores.filter(standardized_test_id=new_score.standardized_test_id).distinct()
        # We should only ever have one list

        # only continue with the learning if we have at least 5 examples to train off of, and 3 to test
        training_size = 5
        prediction_size = 3
        if test_list.count() < training_size + prediction_size + 1:
            return to_return  # return empty

        # extract the data
        dates = [score.date for score in test_list]
        # add on the current score
        dates.append(new_score.date)
        dates_index = pd.Index(data=dates)

        date_offsets = [(datetime.now().date() - current_date).days for current_date in dates]
        date_offsets_series = pd.Series(data=date_offsets, index=dates_index)

        test_scores = [score.score for score in test_list]
        # add on the current score
        test_scores.append(new_score.score)
        test_scores_series = pd.Series(data=test_scores, index=dates_index)

        combined_series = pd.concat([test_scores_series, date_offsets_series], axis=1)

        # make new dataframes, fill them, and drop any inequalities
        test_df = pd.DataFrame(data=combined_series, index=dates_index)
        test_df = test_df.dropna()  # just to be safe
        test_df = test_df.sort_index()

        # Separate into train and predict
        train_data = test_df[:-prediction_size]
        test_data  = test_df[-prediction_size:]


        # machine learnin'
        clf = svm.OneClassSVM(nu=0.7, kernel='rbf', gamma='auto')
        clf.fit(train_data)
        prediction_data = clf.predict(test_data)

        # 1 means expected, -1 means this is an abnormality

        # if the last 2 are abnormalities, trigger a notification
        student_name = new_score.student.first_name + " " + new_score.student.last_name
        test_name = new_score.standardized_test.test_name
        if sum(prediction_data) <= -3:
            title = "Abnormal Test Scores"
            body = "Sprout has noticed an abnormal pattern of recent test scores for " + \
                   student_name + " on the " + test_name + " test."
            date = str(new_score.date)
            student = new_score.student
            notification = Notification(title, body, date, student)
            to_return.append(notification)

        # raise NotImplemented  # use this to not have to edit behaviors everytime for debugging
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
        # attendance doesn't lead to very trackable data, and it's really hard to separate legitimate absences from
        # problematic ones. This isn't planned to be implemented
        to_return = []

        return to_return
