app.controller('passwordResetController', function ($scope, $rootScope, $location, userService, studentService) {
    $scope.location = $location;

    $scope.successfulReset = false;

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
            || input === '') 
        {
            return false;
        }
        return true;
    }

    /**
     * attempts to send a password reset link to email
     */
    $scope.attemptPasswordReset = function (event) {
        event.preventDefault();

        $scope.successfulReset = false;

        if(!validateInput($scope.email)) {
            displayErrors('Email must not be blank.');
            return;
        }

        var savedEmail = $scope.email;

        userService.resetPassword($scope.email).then(
            function success(response) {
                $scope.lastEmail = savedEmail;
                $scope.successfulReset = true;
                displayErrors([]);
            }, function error(response) {
                if (response.data && response.data['non_field_errors']) {
                    displayErrors(response.data['non_field_errors']);
                }

                if (response.data && response.data['email']) {
                    displayErrors(response.data['email']);
                }
            }
        );
    };

});
