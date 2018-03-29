import random


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

        # https://stackoverflow.com/a/4143837/3518046
        behavior_lists = {}
        for behavior in self.behavior_efforts:
            behavior_lists.setdefault(behavior.enrollment_id, []).append(behavior)

        newlist = sorted(self.behavior_efforts, key=lambda x: x.date)
        # behavior past this point relies on the data being sorted by date.

        #todo: enforce no duplicate progress and caution categories

        self.progress_category_choice = rand_val #todo: fix superhacky stuff

        if rand_val == 0:
            return 'test__2018-01-01__2018-03-08__' + str(self.test_scores[test_len - 1].standardized_test_id)
        if rand_val == 1:
            return 'behavior__2018-02-22__2018-03-08__' + str(self.behavior_efforts[behavior_len - 1].enrollment_id)
        if rand_val == 2:
            return 'effort__2018-03-01__2018-03-08__' + str(self.behavior_efforts[behavior_len - 1].enrollment_id)

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
            return 'test__2018-01-01__2018-03-08__' + str(self.test_scores[test_len - 1].standardized_test_id)
        if rand_val == 1:
            return 'behavior__2018-02-22__2018-03-08__' + str(self.behavior_efforts[behavior_len - 1].enrollment_id)
        if rand_val == 2:
            return 'effort__2018-03-01__2018-03-08__' + str(self.behavior_efforts[behavior_len - 1].enrollment_id)

    def prepare_focus_category(self, focus):
        """
        Convert the category the user has selected into the format expected by the frontend

        :param focus: category string selected by the user
        :return: prepared version of focus
        :rtype: str
        """
        return focus
