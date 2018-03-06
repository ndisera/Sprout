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
            The instance will be destroyed
        Future focus student records will create a new instance of this class
    """

    def __init__(self, grades, attendances, behavior_efforts, test_scores):
        """
        Construct a CategoryCalculator, storing all relevant datalists for future use

        All parameters are lists of the corresponding models in the database
        """
        self.grades = grades
        self.attendances = attendances
        self.behavior_efforts = behavior_efforts
        self.test_scores = test_scores
        pass

    def get_progress_category(self):
        """
        Get the category which Sprout has identified the student doing well in

        :return: a category to be included with the FocusStudent object
        :rtype: str
        """
        # The contructors for the data that I can use
        # grades = [grade for grade in Grade.objects.filter(student=representation['student'])]
        # attendances = []  # Attendances not currently tracked by Sprout
        # behavior_efforts = [record for record in Behavior.objects.filter(enrollment__student=representation['student'])]
        # test_scores = [score for score in StandardizedTestScore.objects.filter(student=representation['student'])]

        # todo: remove import for random call once fleshed out

        # separator character is 2 underscores

        # name__StartDate__EndDate__specificId
        # ex) test__2018-02-21__2018-02-28__1
        randVal = random.randint(1, 4)

        # if randVal == 1:
        #     return 'test'
        # if randVal == 2:
        return 'effort__2018-01-01__2018-02-01__42'
        # if randVal == 3:
        #     return 'effort'
        # return 'grades'

    def get_caution_category(self):
        """
        Get the category which Sprout has identified the student doing poorly in

        :return: a category to be included with the FocusStudent object
        :rtype: str
        """
        randVal = random.randint(1, 4)

        # if randVal == 1:
        #     return 'test'
        # if randVal == 2:
        #     return 'behavior'
        # if randVal == 3:
        return 'test__2018-01-01__2018-02-01__1'
        # return 'grades'


