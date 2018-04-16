
import inspect
from enum import Enum


class ChoiceEnum(Enum):

    @classmethod
    def choices(cls):
        # get all members of the class
        members = inspect.getmembers(cls, lambda m: not(inspect.isroutine(m)))
        # filter down to just properties
        props = [m for m in members if not(m[0][:2] == '__')]
        # format into django choice tuple
        choices = tuple([(str(p[1]), p[0]) for p in props])
        return choices


class NotificationCategories(ChoiceEnum):
    """
    Define machine-readable categories for notifications
    """
    BIRTHDAY = 1
    GRADE = 2
    IEP_GOAL = 3
    BEHAVIOR = 4
    TEST_SCORE = 5
    ATTENDANCE = 6


class ServiceType(ChoiceEnum):
    """
    Define machine-readable service types
    """
    BEHAVIOR = 0
    PSYCH = 1
    SPEECH_THERAPY = 2
    OCCUPATIONAL_THERAPY = 3
    PHYSICAL_THERAPY = 4
    ADAPTIVE_PE = 5
    TRANSPORTATION = 6
    ESY = 7
    PERSONAL_HEALTH_CARE = 8
    AUDIOLOGICAL = 9
    VISION = 10
    MATH = 11
    READING = 12
    WRITING = 13
    ACADEMIC_SUPPORT = 14
    TRANSITION = 15
