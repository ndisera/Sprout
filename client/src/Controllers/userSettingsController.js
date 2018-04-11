app.controller("userSettingsController", function($scope, $rootScope, $location, toastService, userService) {
    $scope.location = $location;

    $scope.user = userService.user;
    $scope.userE = Object.assign({}, $scope.user);
    $scope.userEdit = false;

    /**
     * Toggles user edit
     */
    $scope.toggleUserEdit = function() {
        $scope.userEdit = !$scope.userEdit;
    };

    /**
     * Updates the selected user with the newly edited field.
     */
    $scope.saveUEdit = function() {
        // save with userE
        var tempUser = Object.assign({}, $scope.userE);
        var token = tempUser.token;
        tempUser.first_name = tempUser.firstName;
        tempUser.last_name = tempUser.lastName;
        delete tempUser.firstName;
        delete tempUser.lastName;
        delete tempUser.id;
        delete tempUser.token;
        var userPromise = userService.updateUser($scope.userE.id, tempUser);
        userPromise.then(function success(data) {
            // set user to userE to reflect update
            $scope.user = Object.assign({}, $scope.userE);
            $scope.userEdit = false;
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to save your edit." + errorResponse());
        });
    };

    /**
     * Updates the displayed error message.
     * @param {response} response - response containing data and error message.
     */
    function setErrorMessage(response) {
        $scope.errorMessage = response.data;
    }

    /**
     * Extra part of error message
     */
    function errorResponse() {
        var message = "";
        if ($scope.errorMessage != null && $scope.errorMessage !== "") {
            message = " Error message: " + $scope.errorMessage;
        }
        return message;
    }

    /**
     * Updates the user's password
     */
    $scope.savePassword = function() {
        userService.loggedInLogin($scope.user.email, $scope.oldPassword).then(
            function success(response) {
                var passwordObj = {
                    new_password1: $scope.newPassword,
                    new_password2: $scope.confirmPassword
                }
                userService.changePassword(passwordObj).then(
                    function pSuccess(pResponse) {
                        toastService.success("New password has been saved.");
                        $scope.oldPassword = "";
                        $scope.newPassword = "";
                        $scope.confirmPassword = "";
                    },
                    function error(pResponse) {
                        // fatal error occurs here, do I need to save token or something?
                        setErrorMessage(pResponse);
                        toastService.error("New password could not be saved." + errorResponse());
                    }
                );
            },
            function error(response) {
                setErrorMessage(response);
                var extraMessage = "";
                if ($scope.errorMessage != null && $scope.errorMessage !== "") {
                    extraMessage = " Old password was incorrect.";
                }
                toastService.error("New password could not be saved." + extraMessage);
            }
        );
    };
});
