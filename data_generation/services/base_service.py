
from abc import ABCMeta


class BaseService():
    __metaclass__ = ABCMeta # Mark this class as abstract, since it does nothing useful by itself

    complete_uri_template = "{protocol}://{hostname}:{port_num}/{endpoint}"

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