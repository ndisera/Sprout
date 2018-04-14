import random
import pandas as pd
from sklearn import linear_model
import statsmodels.api as sm


class CategoryCalculator():
    # todo: wrap everything in a try catch. This code should NEVER error out
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
        # separator character is 2 underscores

        # name__StartDate__EndDate__specificId
        # ex) test__2018-02-21__2018-02-28__1

        # https://stackoverflow.com/a/4143837/3518046
        behavior_effort_lists = {} # todo: split into separate behavior and effort, and remember that we want the average now
        for behavior in self.behavior_efforts:
            behavior_effort_lists.setdefault(behavior.enrollment_id, []).append(behavior)

        test_lists = {}
        for test in self.test_scores:
            test_lists.setdefault(test.standardized_test_id, []).append(test)

        # Make a map from a dataframe column id to a behavior/test/effort category
        df_map = {}
        df_counter = 0
        df = pd.DataFrame()

        ### Tests
        for test_scores in test_lists.itervalues():  # Dict
            # set a mapping, so we can do a lookup later
            df_map[df_counter] = ('test', test_scores[0].standardized_test_id)

            # extract the data
            dates = [test_val.date for test_val in test_scores]
            dates_index = pd.Index(data=dates)
            scores = [test_val.score for test_val in test_scores]
            test_series = pd.Series(data=scores, index=dates_index)

            # union the two indexes together to 'merge/interweave' the lists
            new_df_indexes = df.index.union(dates_index)

            # reindex our dataframe. Otherwise, the new data will be stuck in limbo and never considered
            df = df.reindex(index=new_df_indexes)
            # put the data into our dataframe
            df[df_counter] = test_series
            df_counter += 1

        ### Behaviors/efforts

        # Preprocess the data to take the average
        behavior_df = pd.DataFrame()
        effort_df = pd.DataFrame()
        b_e_counter = 0

        for behaviors_efforts in behavior_effort_lists.itervalues():
            # for each thing in the list,
            # check to see if that date is already in the series
            # if not, add it
            # if yes, take the average

            # extract the data
            dates = [score.date for score in behaviors_efforts]
            dates_index = pd.Index(data=dates)
            behaviors = [score.behavior for score in behaviors_efforts]
            behaviors_series = pd.Series(data=behaviors, index=dates_index)
            efforts = [score.effort for score in behaviors_efforts]
            efforts_series = pd.Series(data=efforts, index=dates_index)

            # union the two indexes together to 'merge/interweave' the lists
            new_be_df_indexes = behavior_df.index.union(dates_index)

            # reindex our dataframes. Otherwise, the new data will be stuck in limbo and never considered
            behavior_df = behavior_df.reindex(index=new_be_df_indexes)
            effort_df = effort_df.reindex(index=new_be_df_indexes)
            # put the data into our dataframes
            behavior_df[b_e_counter] = behaviors_series
            effort_df[b_e_counter] = efforts_series
            b_e_counter += 1

        # take the means
        behavior_means = behavior_df.mean(axis=1)
        effort_means = effort_df.mean(axis=1)

        # add the means into the master dataframe
        # union the two indexes together to 'merge/interweave' the lists
        new_df_indexes = df.index.union(behavior_means.index).union(effort_means.index)

        # reindex our dataframe. Otherwise, the new data will be stuck in limbo and never considered
        df = df.reindex(index=new_df_indexes)
        # put the data into our dataframe
        df_map[df_counter] = ('behavior', 0)  # specific id of 0 because we're dealing with the average, not a class
        df[df_counter] = behavior_means[0]
        df_counter += 1
        df_map[df_counter] = ('effort', 0)
        df[df_counter] = effort_means[0]
        df_counter += 1

        ### Grades

        # Attendances, maybe not. It doesn't lend itself to a view of progress that meshes well with a graph

        # This is the one!!!!!  Converts dates into days elapsed since the first day
        # map(lambda x: x.days, (df.index.values - df.index[0]))

        # Do linear regression on the test scores
        # Independent variables: test scores
        # Dependent variable: date
        #   The rationale behind this is that we want to predict if a student will do better or worse on a date because
        #   of a particular test. We want to choose that test to display
        #   More intuitively, the y axis is the independent variable: score. The x axis is the dependent variable: time

        X = map(lambda x: x.days, (df.index.values - df.index[0]))  # convert dates into days elapsed
        X = sm.add_constant(X)  # Add constant to allow fitting the y-intercept

        # list of tuples containing (df column, start date, end date, r-squared value, and coefficient)
        results_dic = []

        # todo: start from the present and work our way back. Stop when we see something that looks good enough
        # todo: don't even consider something if the most recent dqatapoint is more than 2 weeks old
        for i in range(0, len(df.index), 3):  # Step size of 3 when shrinking data down
            for curr_dataset in df:
                y = df[curr_dataset]  # todo: do each value individually and see if there's a difference
                model = sm.OLS(y[i:], X[i:], missing='drop').fit()

                # Store the information
                results_dic.append((curr_dataset, df.index[i], df.last_valid_index(), model.rsquared, model.params[1]))

        # Select the progress category by choosing the run with the highest r^2 value
        display_result = max(results_dic, key=lambda x: x[4])
        display_category = df_map[display_result[0]][0]
        display_start = display_result[1]
        display_end = display_result[2]
        display_id = df_map[display_result[0]][1]

        return display_category + '__' + str(display_start) + '__' + str(display_end) + '__' + str(display_id)


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
