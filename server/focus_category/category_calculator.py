import random
import pandas as pd
from sklearn import linear_model


class CategoryCalculator():
    """
    Everything necessary to calculate a focus student's Progress and Caution categories

    This class will be used as follows:
        A request will be made to the backend for a Focus Student record
        The backend will check whether it has valid, cached data. If so, that will be returned
        Otherwise, an instance of this class will be created, and:
            get_progress_category will be called
            get_caution_category will be called
            prepare_focus_category will be called
            The instance will be destroyed
        Future focus student records will create a new instance of this class
    """

    def __init__(self, student, grades, attendances, behavior_efforts, test_scores):
        """
        Construct a CategoryCalculator, storing all relevant datalists for future use

        :param student: api.models.Student object who is being focused
        All other parameters are QuerySets of the corresponding models in the database related to the focused student
        """
        self.student = student
        self.progress_category_choice = None
        self.grades = grades
        self.attendances = attendances
        self.behavior_efforts = behavior_efforts
        self.test_scores = test_scores
        self.no_data_string = "none______"

        if len(behavior_efforts) != 0:
            random.seed(behavior_efforts[0].enrollment.student_id)  # We want consistent random behavior
        else:
            random.seed(21)  # Nothing should really be displayed after this point, but we want to be consistent

    def get_progress_category(self):
        """
        Get the category which Sprout has identified the student doing well in

        :return: a category to be included with the FocusStudent object
        :rtype: str
        """
        # The constructors for the data that I can use
        # grades = [grade for grade in Grade.objects.filter(student=representation['student'])]
        # attendances = []  # Attendances not currently tracked by Sprout
        # behavior_efforts = [record for record in Behavior.objects.filter(enrollment__student=representation['student'])]
        # test_scores = [score for score in StandardizedTestScore.objects.filter(student=representation['student'])]

        # separator character is 2 underscores

        # name__StartDate__EndDate__specificId
        # ex) test__2018-02-21__2018-02-28__1
        rand_val = random.randint(0, 2)
        behavior_len = len(self.behavior_efforts)
        test_len = len(self.test_scores)
        # Make sure to check for no data down the line using the lengths

        behavior_lists = sorted(self.behavior_efforts, key=lambda x: x.date)
        test_lists = sorted(self.test_scores, key=lambda x: x.date)

        # https://stackoverflow.com/a/4143837/3518046
        behavior_lists = {} # todo: split into separate behavior and effort, and remember that we want the average now
        for behavior in self.behavior_efforts:
            behavior_lists.setdefault(behavior.enrollment_id, []).append(behavior)

        test_lists = {}
        for test in self.test_scores:
            test_lists.setdefault(test.standardized_test_id, []).append(test)

        # Make a map from a dataframe column id to a behavior/test/effort category
        df_map = {}
        df_counter = 0
        df = pd.DataFrame()

        # for key, value in behavior_lists:
        #     df_map[df_counter] = ('behavior', behavior.enrollment_id)
        #     df[df_counter] = behavior
        #     df_counter += 1

# todo: test for if a test has no entered scores
        for key, test_scores in test_lists.iteritems():  # Dict
            # set a mapping, so we can do a lookup later
            df_map[df_counter] = ('test', test_scores[0].standardized_test_id)

            # extract the data
            dates = [test_val.date for test_val in test_scores]
            scores = [test_val.score for test_val in test_scores]
            test_series = pd.Series(data=scores, index=dates)

            # put the data into our dataframe
            df[df_counter] = test_series

            # Now go over each test score and add it to the dataframe
            # for test_val in test_scores: # List
            #     df[test_val.date, df_counter] = test_val.score
            #
            df_counter += 1




        #todo: enforce no duplicate progress and caution categories

        self.progress_category_choice = rand_val #todo: fix superhacky stuff

        if rand_val == 0:
            if test_len != 0:
                return 'test__2018-01-01__2018-03-08__' + str(self.test_scores[test_len - 1].standardized_test_id)
        if rand_val == 1:
            if behavior_len != 0:
                return 'behavior__2018-02-22__2018-03-08__' + str(self.behavior_efforts[behavior_len - 1].enrollment_id)
        if rand_val == 2:
            if behavior_len != 0:
                return 'effort__2018-03-01__2018-03-08__' + str(self.behavior_efforts[behavior_len - 1].enrollment_id)

        # We didn't find anything: return none
        return self.no_data_string

    def get_caution_category(self):
        """
        Get the category which Sprout has identified the student doing poorly in

        :return: a category to be included with the FocusStudent object
        :rtype: str
        """
        rand_val = random.randint(0, 2)
        behavior_len = len(self.behavior_efforts)
        test_len = len(self.test_scores)

        if rand_val == self.progress_category_choice:
            rand_val = (rand_val + 1) % 3

        if rand_val == 0:
            if test_len != 0:
                return 'test__2018-01-01__2018-03-08__' + str(self.test_scores[test_len - 1].standardized_test_id)
        if rand_val == 1:
            if behavior_len != 0:
                return 'behavior__2018-02-22__2018-03-08__' + str(self.behavior_efforts[behavior_len - 1].enrollment_id)
        if rand_val == 2:
            if behavior_len != 0:
                return 'effort__2018-03-01__2018-03-08__' + str(self.behavior_efforts[behavior_len - 1].enrollment_id)

        # We didn't find anything: return none
        return self.no_data_string

    def prepare_focus_category(self, focus):
        """
        Convert the category the user has selected into the format expected by the frontend

        :param focus: category string selected by the user
        :return: prepared version of focus
        :rtype: str
        """
        return focus

    def filter_data_frame(self, begin_date, end_date, master_frame):
        """
        Constructs a data frame with the given data from the start date to the end date, inclusive
        :param begin_date: the date to start the dataframe
        :param end_date: the date to end the dataframe
        :param master_frame: the dataframe containing all of the compiled information
        :return: a pandas dataframe with only the requested date range
        """
