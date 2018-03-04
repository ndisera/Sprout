from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate, APIClient

from api.models import *

import filecmp
import os

class FileUploadTestCase(TestCase):
    path_to_image = os.path.join('../client/public/img/example_kid.jpeg')
    factory = APIRequestFactory()

    def setUp(self):
        self.client = APIClient()
        self.user = SproutUser.objects.create(email='test@example.com')
        userprofile = SproutUserProfile.objects.create(user=self.user,
                                                       first_name='Test',
                                                       last_name='Test')
        self.user.sproutuserprofile = userprofile
        self.URL = '/users/{user_pk}/picture/'.format(user_pk=self.user.id)

        self.data = {
            'user': self.user.id,
            'file': open(self.path_to_image, 'rb')
        }

    def test_upload_image_unauthenticated(self):
        # Verify that authentication is required to upload an image
        response = self.client.post(self.URL, self.data, format='multipart')
        self.assertEquals(response.status_code, 401)

    def test_upload_image_authenticated(self):
        # Verify that a file can be uploaded once authenticated
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.URL, self.data, format='multipart')
        self.assertEquals(response.status_code, 201)
        return response

    def test_verify_uploaded_image(self):
        """
        Verify that the image returned is the same as the one uploaded
        :return:
        """
        original_file = open(self.path_to_image, 'rb')

        upload_response = self.test_upload_image_authenticated()
        upload_id = upload_response.data['profile_picture']['id']
        picture_model = ProfilePicture.objects.filter(id=upload_id)
        picture_model[0].refresh_from_db()

        list_url = self.URL
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, 200, msg="Unable to GET profile picture")
        pictures = response.data['profile_pictures']
        self.assertEqual(len(pictures), 1, msg="Should only be one picture returned")
        picture = pictures[0]
        get_url = self.URL + str(picture['id'])

        # Get the actual picture
        response = self.client.get(get_url)
        self.assertEqual(response.status_code, 200, msg="Unable to GET profile picture")
        new_file = response.content
        self.assertEqual(new_file, original_file.read(), msg="Downloaded file not the same as uploaded file!")
    