app.controller('passwordResetConfirmController', function ($scope, $rootScope, $location, $route, toastService, userService, studentService) {
    $scope.location = $location;

    console.log($route.current.params);

    // arrays for all alerts to display to user
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
            _.each(_.flatten(messages), addString);

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
            || input === '') 
        {
            return false;
        }
        return true;
    }

    /**
     * changes the user's password
     */
    $scope.attemptConfirmNewPassword = function (event) {
        event.preventDefault();

        $scope.successfulReset = false;

        if(!validateInput($scope.password1) || !validateInput($scope.password2)) {
            displayErrors('Passwords must not be blank.');
            return;
        }

        if($scope.password1 !== $scope.password2) {
            displayErrors('Passwords must match.');
            return;
        }

        var obj = {
            uid: $route.current.params.id,
            token: $route.current.params.token,
            new_password1: $scope.password1,
            new_password2: $scope.password2,
        }

        userService.confirmNewPassword(obj).then(
            function success(response) {
                toastService.success('Your password was reset! Please log in.');
                $location.path('/login');
            }, function error(response) {
                var errors = [];
                if(response.data) {
                    if (response.data['token']) {
                        toastService.error('Whoops! You reset password link has expired. Please reset your password again.');
                        $location.path('/password/reset');
                    }

                    var errors = [];
                    if (response.data['non_field_errors']) {
                        errors.push(response.data['non_field_errors']);
                    }

                    _.each(_.keys(obj), function(key) {
                        if(_.has(response.data, key)) {
                            // replace a bad error message with a more descriptive one
                            var errorIdx = _.indexOf(response.data[key], 'This password is too common.');
                            if(errorIdx > -1) {
                                response.data[key][errorIdx] = 'Your password must be at least 8 characters long and contain at least one number or symbol.';
                            }
                            errors.push(response.data[key]);
                        }
                    });
                }
                displayErrors(errors);

            }
        );
    };

});
