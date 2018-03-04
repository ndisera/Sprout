app.controller("userSettingsController", function($scope, $rootScope, $location, toastService, userService) {

    $scope.user = userService.user;
    $scope.viewUFirstName = true;
    $scope.viewULastName = true;
    $scope.viewUEmail = true;
    $scope.editingAll = true;

    /**
     * Turns the displayed user field into an editable input.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.editUser = function(field) {
        switch (field) {
            case "firstname":
                $scope.viewUFirstName = false;
                checkIfAllSelected();
                break;
            case "lastname":
                $scope.viewULastName = false;
                checkIfAllSelected();
                break;
            case "none":
                $scope.viewUFirstName = true;
                $scope.viewULastName = true;
                $scope.editingAll = true;
                break;
            case "all":
                $scope.viewUFirstName = false;
                $scope.viewULastName = false;
                $scope.editingAll = false;
                break;
            default:
        }
    };

    /**
     * Restored the previous display of the selected user field and hides the editable input box.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.cancelUEdit = function(field) {
        switch (field) {
            case "firstname":
                $scope.viewUFirstName = true;
                $scope.uFirstName = "";
                break;
            case "lastname":
                $scope.viewULastName = true;
                $scope.uLastName = "";
                break;
            default:
        }
        checkIfAllSelected();
    };

    /**
     * Sets edit all button according to what edit fields are ready to edit.
     */
    function checkIfAllSelected() {
        if ($scope.viewUFirstName === true && $scope.viewULastName === true) {
            $scope.editingAll = true;
        } else if ($scope.viewUFirstName === false && $scope.viewULastName === false) {
            $scope.editingAll = false;
        }
    }

    /**
     * Updates the selected user with the newly edited field.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.saveUEdit = function(field) {
        $scope.userE = Object.assign({}, $scope.user);
        switch (field) {
            // update field
            case "firstname":
                $scope.userE.firstName = $scope.uFirstName;
                break;
            case "lastname":
                $scope.userE.lastName = $scope.uLastName;
                break;
            default:
        }
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
            switch (field) {
                // set view after call returns
                case "firstname":
                    $scope.viewUFirstName = true;
                    $scope.uFirstName = "";
                    break;
                case "lastname":
                    $scope.viewULastName = true;
                    $scope.uLastName = "";
                    break;
                default:
            }
            checkIfAllSelected();
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
        $scope.errorMessage = [];
        for (var property in response.data) {
            if (response.data.hasOwnProperty(property)) {
                for (var i = 0; i < response.data[property].length; i++) {
                    $scope.errorMessage.push(response.data[property][i]);
                }
            }
        }
        $scope.errorMessage = $scope.errorMessage.join(" ");
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
