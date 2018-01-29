app.factory("userService", function ($rootScope, $http, $q) {

    var userService = {};

    // establish default unauthorized user
    var user = {
        username: null, 
        token: null,
        email: null,
        firstName: null,
        lastName: null,
        id: null,
        auth: false,
    };

    function loadToken() {
        user.token = localStorage.getItem($rootScope.tokenKey);
    }

    function saveToken(token) {
        user.token = token;
        if(token === null) {
            localStorage.removeItem($rootScope.tokenKey);
        }
        else {
            localStorage.setItem($rootScope.tokenKey, token);
        }
    }

    function saveUser(userObj) {
        user.id        = _.has(userObj, 'id') ? userObj.id : null;
        user.username  = _.has(userObj, 'username') ? userObj.username : null;
        user.email     = _.has(userObj, 'email') ? userObj.email : null;
        user.firstName = _.has(userObj, 'first_name') ? userObj.first_name : null;
        user.lastName  = _.has(userObj, 'last_name') ? userObj.last_name : null;
    }

    /**
     * Send a login attempt
     *
     * Response will be:
     * 200 OK, indicating a successful login, in which case the auth token will be
     * response.data["token"]
     * 400 Bad Request, indicating a failed login, in which case a list of errors will
     * be response.data["non_field_errors"]
     *
     * @param {string} username - the user's username
     * @param {string} password - the user's password
     *
     * @return {promise} promise that will resolve to the response
     */
    userService.login = function(username, password) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/login/',
            headers: { 'Content-Type': 'application/json' },
            data: { 'username': username, 'password': password },
        }).then(function success(response) {
            // save token and user
            saveToken(response.data.token);
            saveUser(response.data.user);
            user.auth = true;

            // notify app that user has logged in
            $rootScope.$emit('user:auth', { type: 'login' });

            deferred.resolve(response);
        }, function error(response) {
            saveToken(null);
            saveUser(null);
            user.auth = false;

            // notify app that there was a problem, assume user is not auth-ed
            $rootScope.$emit('user:auth', { type: 'logout' });

            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Send a logout attempt
     *
     * Response will be:
     * 201 Created, indicating a successful logout
     * 400 Bad Request, indicating a failed logout
     *
     * @return {promise} promise that will resolve to the response
     */
    userService.logout = function() {
        // remove token from storage
        saveToken(null);
        saveUser(null);
        user.auth = false;

        // notify app that user has logged out
        $rootScope.$emit('user:auth', { type: 'logout' });

        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/logout/',
            headers: {'Content-Type': 'application/json'},
        }).then(function success(response) {
            deferred.resolve(response);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Check whether the current authentication token is valid
     *
     * Response will be:
     * 200 OK, indicating the passed authentication was valid
     * 401 Unauthorized, indicating the passed authentication was invalid
     *
     * @param {boolean} includeUser - if true, will request the user object
     *
     * @return {promise} promise that will resolve to the response
     */
    userService.authVerify = function(includeUser) {
        var query = '';
        if(includeUser) {
            query = '?user=true';
        }

        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/auth-verify/' + query,
        }).then(function success(response) {
            if(_.has(response.data, 'user')) {
                saveUser(response.data.user);
            }
            user.auth = true;

            // notify app that user is logged in
            $rootScope.$emit('user:auth', { type: 'login' });

            deferred.resolve(response.data);
        }, function error(response) {
            saveToken(null);
            saveUser(null);
            user.auth = false;

            // notify app that there was a problem, assume user is not auth-ed
            $rootScope.$emit('user:auth', { type: 'logout' });

            deferred.reject(response);
        });
        return deferred.promise;
    };

    userService.user = user;
    userService.loadToken = loadToken;
    userService.saveToken = saveToken;
    userService.saveUser = saveUser;

    return userService;
});




