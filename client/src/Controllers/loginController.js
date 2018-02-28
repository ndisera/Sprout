app.controller('loginController', function ($scope, $rootScope, $location, userService, studentService) {

    // array for all errors to display to user
    $scope.errors = [];

    /**
     * Edits the errors array to display error messages on screen
     *
     * @param {string|array} messages - array or string of messages to display
     */
    function displayErrors(messages) {
        while($scope.errors.length > 0) {
            $scope.errors.pop();
        }

        var addString = function(message) { $scope.errors.push(message); }

        if(_.isArray(messages)) {
            _.each(messages, addString);

        }
        else if(_.isString(messages)) {
            addString(messages);
        }
    }

    /**
     * Checks if input is null, undefined, NaN, or blank. Used to verify
     * content of email and password fields.
     *
     * @param {string} input - input to verify
     *
     * @return {boolean} - whether or not it's valid
     */
    function validateInput(input) {
        if(input === null 
            || input === undefined 
            || input === NaN
            || input === "") 
        {
            return false;
        }
        return true;
    }

    /**
     * Verify if token from local storage (if exists) is valid
     */
    if(userService.user.token !== null) {
        var includeUser = true;
        userService.authVerify(includeUser).then(
            function success(data) {
                $location.path('');
            },
            function error(response) {
                userService.saveToken(null);
                userService.saveUser(null);
            }
        );
    }

    /**
     * Checks login credentials and logs the user in if valid.
     */
    $scope.attemptLogin = function (event) {
        event.preventDefault();

        if(!validateInput($scope.email) || !validateInput($scope.password)) {
            displayErrors("Email and password must not be blank.");
            return;
        }

        userService.login($scope.email, $scope.password).then(
            function success(response) {
                $location.path('');
            }, function error(response) {
                if (response.data && response.data["non_field_errors"]) {
                    displayErrors(response.data["non_field_errors"]);
                }

                if (response.data && response.data["email"]) {
                    displayErrors(response.data["email"]);
                }
            }
        );
    };

});
