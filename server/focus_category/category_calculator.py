from datetime import datetime, timedelta
import pandas as pd
import statsmodels.api as sm
import logging
import traceback



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
        self.analysis_results = []
        self.df_map = {}

        self.logger = logging.getLogger("category calculator logger")

        self.analyze_data() # do the data analysis at the very beginning

    def get_progress_category(self):
        """
        Get the category which Sprout has identified the student doing well in

        :return: a category to be included with the FocusStudent object
        :rtype: str
        """

        # Select the progress category by choosing the run with the highest r^2 value

        # analysis result example:
        # (model.params[1], curr_dataset,
        # df.first_valid_index(), df.last_valid_index(),
        # model.rsquared)

        # return value example: 'test__2018-01-01__2018-03-08__specific-id'
        if any(self.analysis_results):
            display_result = max([x for x in self.analysis_results if x is not None], key=lambda x: x[0])
            if display_result[0] > 0:
                display_category = self.df_map[display_result[1]][0]
                display_start = display_result[2]
                display_end = display_result[3]
                display_id = self.df_map[display_result[1]][1]
                return display_category + '__' + str(display_start) + '__' + str(display_end) + '__' + str(display_id)

        # default
        return self.no_data_string

    def get_caution_category(self):
        """
        Get the category which Sprout has identified the student doing poorly in

        :return: a category to be included with the FocusStudent object
        :rtype: str
        """

        # see the get_progress_category for data examples

        if any(self.analysis_results):
            display_result = min([x for x in self.analysis_results if x is not None], key=lambda x: x[0])
            if display_result[0] < 0:
                display_category = self.df_map[display_result[1]][0]
                display_start = display_result[2]
                display_end = display_result[3]
                display_id = self.df_map[display_result[1]][1]
                return display_category + '__' + str(display_start) + '__' + str(display_end) + '__' + str(display_id)

        # default
        return self.no_data_string

    def prepare_focus_category(self, focus):
        """
        Convert the category the user has selected into the format expected by the frontend

        :param focus: category string selected by the user
        :return: prepared version of focus
        :rtype: str
        """
        return focus

    def analyze_data(self):
        # separator character is 2 underscores

        # name__StartDate__EndDate__specificId
        # ex) test__2018-02-21__2018-02-28__1

        # dataframe order: tests (per test), avg behavior, avg effort, grades (per class)

        try:
            # https://stackoverflow.com/a/4143837/3518046
            behavior_effort_lists = {}
            for behavior in self.behavior_efforts:
                behavior_effort_lists.setdefault(behavior.enrollment_id, []).append(behavior)

            test_lists = {}
            for test in self.test_scores:
                test_lists.setdefault(test.standardized_test_id, []).append(test)

            # grades are separated by class (section_id)
            grades_lists = {}
            for grade in self.grades:
                grades_lists.setdefault(grade.assignment.section_id, []).append(grade)

            # Make a map from a dataframe column id to a behavior/test/effort category
            self.df_map = {}
            df_counter = 0
            df = pd.DataFrame()

            ### Tests
            for test_scores in test_lists.itervalues():  # Dict
                # set a mapping, so we can do a lookup later
                self.df_map[df_counter] = ('test', test_scores[0].standardized_test_id)

                # extract the data
                dates = [test_val.date for test_val in test_scores]
                dates_index = pd.Index(data=dates)
                # standardize to a percentage
                test_min = test_scores[0].standardized_test.min_score
                test_max = test_scores[0].standardized_test.max_score
                scores = [(test_val.score - test_min) /
                          float(test_max - test_min)
                          for test_val in test_scores]
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
                # standardize to a percentage
                behaviors = [score.behavior / float(5)
                             for score in behaviors_efforts]
                behaviors_series = pd.Series(data=behaviors, index=dates_index)
                # efforts = [score.effort for score in behaviors_efforts]
                efforts = [score.effort / float(5)
                           for score in behaviors_efforts]
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
            self.df_map[df_counter] = ('behavior', 0)  # specific id of 0 because we're dealing with the average, not a class
            df[df_counter] = behavior_means
            df_counter += 1
            self.df_map[df_counter] = ('effort', 0)
            df[df_counter] = effort_means
            df_counter += 1

            ### Grades
            for grade_scores in grades_lists.itervalues():  # Dict
                # set a mapping, so we can do a lookup later
                self.df_map[df_counter] = ('grades', grade_scores[0].assignment.section_id)

                # extract the data
                dates = [grade_val.handin_datetime.date() for grade_val in grade_scores]
                dates_index = pd.Index(data=dates)
                # standardize to a percentage
                scores = [(grade_val.score - grade_val.assignment.score_min) /
                          float(grade_val.assignment.score_max - grade_val.assignment.score_min)
                          for grade_val in grade_scores]
                grade_series = pd.Series(data=scores, index=dates_index)

                # union the two indexes together to 'merge/interweave' the lists
                new_df_indexes = df.index.union(dates_index)

                # reindex our dataframe. Otherwise, the new data will be stuck in limbo and never considered
                df = df.reindex(index=new_df_indexes)
                # put the data into our dataframe
                df[df_counter] = grade_series
                df_counter += 1

            # Attendances, maybe not. It doesn't lend itself to a view of progress that meshes well with a graph

            # This is the one!!!!!  Converts dates into days elapsed since the first day
            # map(lambda x: x.days, (df.index.values - df.index[0]))

            # Do linear regression on the test scores
            # Independent variables: test scores
            # Dependent variable: date
            #   The rationale behind this is that we want to predict if a student will do better or worse on a date because
            #   of a particular test. We want to choose that test to display
            #   More intuitively, the y axis is the independent variable: score. The x axis is the dependent variable: time

            # convert dates into days elapsed before today
            current_date = datetime.now().date()
            X = map(lambda x: x.days, (df.index.values - current_date))
            X = sm.add_constant(X)  # Add constant to allow fitting the y-intercept

            # list of tuples containing (coefficient, df column, start date, end date, and r-squared value )
            self.analysis_results = []

            for curr_dataset in df:  # curr_dataset is an index of the column in the data set
                # If the most recent data point for a series is more than 2 weeks old, don't consider it for display
                last_data_timedelta = current_date - df[curr_dataset].last_valid_index()
                if last_data_timedelta > timedelta(weeks=2):
                    continue

                positive_example = None
                negative_example = None

                for i in range(3, len(df.index), 3):  # Step size of 3 when expanding from present
                    # if we already have a positive and negative example, move on to the next dataset
                    if positive_example is not None and negative_example is not None:
                        break

                    # get the most recent i dates
                    y = df[curr_dataset][(-1 * i):]

                    # We need to have at least 3 data points:
                    if y.notnull().sum() < 3:
                        continue

                    model = sm.OLS(y, X[(-1 * i):], missing='drop').fit()

                    # normalize our slope:
                    slope_norm = model.params[1] * (y.last_valid_index() - y.first_valid_index()).days

                    # store only the most recent positive and negative examples
                    # store the regression only if it passes a threshold: 20% slope (all our data is normalized)
                    if slope_norm >= 0.20:
                        # only store one positive/negative example per data series
                        if positive_example is None:
                            positive_example = (slope_norm, curr_dataset,
                                                y.first_valid_index(), y.last_valid_index(),
                                                model.rsquared)

                    if slope_norm <= -0.20:
                        if negative_example is None:
                            negative_example = (slope_norm, curr_dataset,
                                                y.first_valid_index(), y.last_valid_index(),
                                                model.rsquared)

                # Store the information needed to generate a results string
                self.analysis_results.append(positive_example)
                self.analysis_results.append(negative_example)

        except Exception as e:
            self.logger.error(e.message)
            self.logger.error(traceback.format_exc())
            return
            # do nothing except log and return
            # This is bad general coding style. However, this code must never ever break. It's much more preferable
            # than to not return


