app.factory("userService", function ($rootScope, $http, $q, queryService) {

    var userService = {};

    // establish default unauthorized user
    var user = {
        token: null,
        email: null,
        firstName: null,
        lastName: null,
        isSuperUser: null,
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
        user.id        = _.has(userObj, 'pk') ? userObj.pk : null;
        user.email     = _.has(userObj, 'email') ? userObj.email : null;
        user.firstName = _.has(userObj, 'first_name') ? userObj.first_name : null;
        user.lastName  = _.has(userObj, 'last_name') ? userObj.last_name : null;
        user.isSuperUser = _.has(userObj, 'is_superuser') ? userObj.is_superuser: null;
    }

    /**
     * Add a user to the system
     * @param {user} userObj - the user object. example -
     * {
     *     email: 'example@fake.com',
     *     first_name: 'example',
     *     last_name: 'exampleton',
     *     password1: 'pw123', // optional
     *     password2: 'pw123', // optional
     * }
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.createUser = function(userObj) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/registration/',
            data: userObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };


    /**
     * Send a login attempt
     *
     * Response will be:
     * 200 OK, indicating a successful login, in which case the auth token will be
     * response.data["token"]
     * 400 Bad Request, indicating a failed login, in which case a list of errors will
     * be response.data["non_field_errors"]
     *
     * @param {string} email - the user's email
     * @param {string} password - the user's password
     *
     * @return {promise} promise that will resolve to the response
     */
    userService.login = function(email, password) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/login/',
            headers: { 'Content-Type': 'application/json' },
            data: { 'email': email, 'password': password },
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
     * Send a login attempt while already logged in
     *
     * Response will be:
     * 200 OK, indicating a successful login, in which case the auth token will be
     * response.data["token"]
     * 400 Bad Request, indicating a failed login, in which case a list of errors will
     * be response.data["non_field_errors"]
     *
     * @param {string} email - the user's email
     * @param {string} password - the user's password
     *
     * @return {promise} promise that will resolve to the response
     */
    userService.loggedInLogin = function(email, password) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/login/',
            headers: { 'Content-Type': 'application/json' },
            data: { 'email': email, 'password': password },
        }).then(function success(response) {
            // save token and user
            saveToken(response.data.token);
            saveUser(response.data.user);
            user.auth = true;

            // notify app that user has logged in
            $rootScope.$emit('user:auth', { type: 'login' });

            deferred.resolve(response);
        }, function error(response) {
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
     * Partially rejects the user
     */
    function rejectUser() {
        saveToken(null);
        saveUser(null);
        user.auth = false;

        // notify app that there was a problem, assume user is not auth-ed
        $rootScope.$emit('user:auth', { type: 'logout' });
    }

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
    userService.authVerify = function(adminRequired = false) {
        var query = '?user=true';

        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/auth-verify/' + query,
        }).then(function success(response) {
            if(_.has(response.data, 'user')) {
                saveUser(response.data.user);
            }

            if (adminRequired && !user.isSuperUser) {
                rejectUser();
                deferred.reject(response);
            } else {
                user.auth = true;

                // notify app that user is logged in
                $rootScope.$emit('user:auth', { type: 'login' });

                deferred.resolve(response.data);
            }
        }, function error(response) {
            rejectUser();
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Get all user records
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.getUsers = function(config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/users' + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Get user record
     * @param {number} userId - the user's id.
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.getUser = function (userId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/users/' + userId + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Delete user record
     * @param {number} userId - the user's id.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.deleteUser = function (userId) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: 'https://' + $rootScope.backend + '/users/' + userId,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Update user record
     * @param {number} userId - the user's id.
     * @param {user} userObj - the user object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.updateUser = function (userId, userObj) {
        var deferred = $q.defer();
        $http({
            method: 'PUT',
            url: 'https://' + $rootScope.backend + '/users/' + userId,
            data: userObj,
        }).then(function success(response) {
            if (user.id === response.data.sprout_user.pk) {
                saveUser(response.data.sprout_user);
            }
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /** FOCUS RECORDS **/

    /**
     * Get all of a user's focus records
     * @param {number} userId - ID of the user
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.getAllFocusForUser = function(userId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/users/' + userId +
                '/focus' + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Get a focus record for user
     * @param {number} userId - the user's id.
     * @param {number} focusId - the focus's id.
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.getFocusForUser = function (userId, focusId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/users/' + userId +
                '/focus/' + focusId + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Create a focus for a user
     * @param {number} userId - the user's id.
     * @param {focus} focusObj - the focus object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.createFocusForUser = function (userId, focusObj) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/users/' + userId +
                '/focus',
            data: focusObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Delete a focus for a user
     * @param {number} userId - the user's id.
     * @param {number} focusId - the focus's id.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.deleteFocusForUser = function (userId, focusId) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: 'https://' + $rootScope.backend + '/users/' + userId +
                '/focus/' + focusId,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Update a focus for a user
     * @param {number} userId - the user's id.
     * @param {number} focusId - the focus's id.
     * @param {focus} focusObj - the focus object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.updateFocusForUser = function (userId, focusId, focusObj) {
        var deferred = $q.defer();
        $http({
            method: 'PUT',
            url: 'https://' + $rootScope.backend + '/users/' + userId +
                '/focus/' + focusId,
            data: focusObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Patch a focus for a user
     * @param {number} userId - the user's id.
     * @param {number} focusId - the focus's id.
     * @param {focus} focusObj - the focus object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    //TODO(gzuber): implement/finish when fixed on backend
    //userService.patchFocusForUser = function (userId, focusId, focusObj) {
        //var deferred = $q.defer();
        //$http({
            //method: 'PUT',
            //url: 'https://' + $rootScope.backend + '/users/' + userId +
                //'/focus/' + focusId,
            //data: focusObj,
        //}).then(function success(response) {
            //deferred.resolve(response.data);
        //}, function error(response) {
            //deferred.reject(response);
        //});
        //return deferred.promise;
    //};

    /*** NOTIFICATION RECORDS ***/

    userService.notificationData = {
        relevantItems: [],
        relevantOffset: {
            value: 35,
            unit: 'd',
        }
    };

    /**
     * Get all of a user's notifications
     * @param {number} userId - ID of the user
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.getAllNotificationsForUser = function(userId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/users/' + userId +
                '/notifications' + query,
        }).then(function success(response) {
            if(response !== null && response !== undefined) {
                if(response.data !== null && response.data !== undefined) {
                    if(response.data.notifications !== null && response.data.notifications !== undefined) {
                        userService.notificationData.relevantItems.length = 0;
                        var relevantDate = moment().add(userService.notificationData.relevantOffset.value, userService.notificationData.relevantOffset.unit);

                        _.each(_.filter(response.data.notifications, function(elem) { return moment(elem.date) < relevantDate && elem.unread; }), function(elem) {
                            userService.notificationData.relevantItems.push(elem);
                        });
                    }
                }
            }
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Get a notification for user
     * @param {number} userId - the user's id.
     * @param {number} notificationId - the notification's id.
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.getNotificationForUser = function (userId, notificationId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/users/' + userId +
                '/notifications/' + notificationId + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Create a notification for a user
     * @param {number} userId - the user's id.
     * @param {focus} notificationObj - the notification object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.createNotificationForUser = function (userId, notificationObj) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/users/' + userId +
                '/notifications',
            data: notificationObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Delete a notification for a user
     * @param {number} userId - the user's id.
     * @param {number} notificationId - the notification's id.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.deleteNotificationForUser = function (userId, notificationId) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: 'https://' + $rootScope.backend + '/users/' + userId +
                '/notifications/' + notificationId,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Update a notification for a user
     * @param {number} userId - the user's id.
     * @param {number} notificationId - the notification's id.
     * @param {focus} notificationObj - the notification object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.updateNotificationForUser = function (userId, notificationId, notificationObj) {
        var deferred = $q.defer();
        $http({
            method: 'PUT',
            url: 'https://' + $rootScope.backend + '/users/' + userId +
                '/notifications/' + notificationId,
            data: notificationObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    /**
     * Update user password
     * @param {password} passwordObj - the password object containing the new password.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    userService.changePassword = function (passwordObj) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/password/change/',
            data: passwordObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
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
