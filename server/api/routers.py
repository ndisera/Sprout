
from dynamic_rest.routers import DynamicRouter
from rest_framework_extensions.routers import NestedRouterMixin

class NestedDynamicRouter(NestedRouterMixin, DynamicRouter):
    pass