app.factory('interceptorService', function ($rootScope) {
    /**
     * This service will intercept all $http requests sent by client
     * and add the Authorization header with the current token from
     * localStorage. Will abort if null.
     */
    return {
        request: function (config) {
            var token = localStorage.getItem($rootScope.tokenKey);

            if(token !== null) {
                config.headers['Authorization'] = 'JWT ' + token;
            }
            return config;
        }
    };
});
