
import datetime
import random

from behavior_service import Behavior, BehaviorService

class BehaviorGenerator:

    def __init__(self, headers={}, url="localhost", port_num=8000, verify=False,):
        self.behaviorService = BehaviorService(headers=headers, url=url, port_num=port_num, verify=verify)

    def generate_random_behavior(self,
                                 enrollment,
                                 date_range_start=datetime.date.today(),
                                 num_days=32):
        """
        Generate a series of behaviors to attach to the enrollment

        :param enrollment:
        :return: list[Behavior]
        """
        behaviors = []

        for day in range(1, num_days):
            date = date_range_start + datetime.timedelta(days=day)
            behavior = Behavior(
                date=date.strftime('%Y-%m-%d'),
                enrollment=enrollment.id,
                effort=random.randint(1, 5),
                behavior=random.randint(1, 5),
                id=None,
            )
            behaviors.append(behavior)
        return behaviors
