import datetime
from django.contrib.auth.hashers import PBKDF2PasswordHasher

class SproutPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """
    Subclass of PBKDF2PasswordHasher which uses a workload factor that automatically
    increases over time to account for potential hash crackers getting faster
    """
    # Recommended number of iterations today, as this program is being written
    recommended_iterations_2018 = 100000
    writing_year = 2018

    future_year = datetime.datetime.now().year

    years_elapsed = future_year - writing_year

    # Double the number of iterations for every year since this was written
    iterations = recommended_iterations_2018 * (2 ** years_elapsed)