
from abc import ABCMeta
import json
import requests


class BaseService():
    __metaclass__ = ABCMeta # Mark this class as abstract, since it does nothing useful by itself

    complete_uri_template = "{protocol}://{hostname}:{port_num}{endpoint}"

    def __init__(self, headers=None, hostname="localhost", protocol="https", port_num=8000, verify=False):
        self.headers = headers
        self.hostname = hostname
        self.protocol = protocol
        self.port_num = port_num
        self.verify = verify
        self.complete_uri_template = self.complete_uri_template.format(protocol=protocol,
                                                                       hostname=hostname,
                                                                       port_num=port_num,
                                                                       endpoint='{endpoint}')

    def _get_models(self, model_type, uri):
        """
        Get all of some kind of model

        :param model_type: Type of model to GET
        :return: list[model]
        """
        response = requests.get(uri, verify=self.verify, headers=self.headers)

        response.raise_for_status()

        body = response.json()
        assert len(body.keys()) == 1, "Cannot handle GET-ing more than one kind of thing"
        key = [key for key in body.keys()][0]
        models = body[key]

        toReturn = []

        for model in models:
            toReturn.append(model_type(**model))

        return toReturn

    def _add_many_models(self, models, uri):
        data = []

        for model in models:
            model = model._asdict()
            del(model['id'])
            data.append(model)

        data = json.dumps(data)

        headers = self.headers
        headers['content-type'] = 'application/json'

        response = requests.post(uri, verify=self.verify, headers=headers, data=data)

        response.raise_for_status()

        return response