
from dynamic_rest.routers import DynamicRouter
from rest_framework_nested.routers import NestedMixin

class NestedDynamicRouter(NestedMixin, DynamicRouter):
    pass