app.factory("loginService", function ($rootScope, $http) {
    return {

        /**
         * Send a login attempt
         *
         * Response will be:
         * 200 OK, indicating a successful login, in which case the auth token will be
         * response.data["token"]
         * 400 Bad Request, indicating a failed login, in which case a list of errors will
         * be response.data["non_field_errors"]
         *
         * @return {promise} promise that will resolve to the response
         */
        login: function (username, password) {
            return $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/login/',
                headers: {'Content-Type': 'application/json'},
                data: {'username':username, 'password':password}
            }).then(function success(response) {
                return response;
            });
        }
    };
});
