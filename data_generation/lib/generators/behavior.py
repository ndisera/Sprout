
import datetime
import random

from lib.services.behavior import Behavior, BehaviorService

class BehaviorGenerator:

    def __init__(self, headers=None, protocol='https', hostname="localhost", port_num=8000, verify=False,):
        self.behaviorService = BehaviorService(headers=headers, protocol=protocol, hostname=hostname, port_num=port_num, verify=verify)

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
        iter_date = date_range_start
        end_date = date_range_start + datetime.timedelta(days=num_days)

        while iter_date < end_date:
            if iter_date.weekday() < 5:
                behavior = Behavior(
                    date=iter_date.strftime('%Y-%m-%d'),
                    enrollment=enrollment.id,
                    effort=random.randint(1, 5),
                    behavior=random.randint(1, 5),
                    id=None,
                )
                behaviors.append(behavior)
            iter_date = iter_date + datetime.timedelta(days=1)

        return behaviors
