app.controller('mainController', function ($scope, $rootScope, $location, studentService, loginService) {

    $scope.studentInfo = studentService.studentInfo;

    studentService.refreshStudents();

    /**
     * Load the authentication token from local storage
     *
     * If we have never authenticated before, this is checked later and we show the login screen
     *
     * @type {string | null}
     */
    $rootScope.JSONWebToken = localStorage.getItem("JSONWebToken");

    /**
     * Store whether the user is logged in
     *
     * @type {boolean}
     */
    $rootScope.loggedIn = false;

    /**
     * Navigates to student's page if name in navigation search bar is valid.
     */
    $scope.tryNavigateToStudent = function() {
        if ($scope.studentName.toUpperCase() in $scope.studentInfo.studentsLookup) {
            $location.path('/student/' + $scope.studentInfo.studentsLookup[$scope.studentName.toUpperCase()].id);
            return;
        }
        else {
            //TODO: notify the user in some way
        }
    };

    /**
     * Clears the main navigation search bar.
     */
    $scope.clearSearch = function () {
        $scope.studentName = "";
    };

    if ($rootScope.loggedIn && $location.path() === "")
        $location.path = '/focus';

    /**
     * Checks login credentials and logs the user in if valid.
     */
    $scope.attemptLogin = function (event) {
        event.preventDefault();
        var loginPromise = loginService.login($scope.username, $scope.password);
        loginPromise.then(
            function success(response) {
                $rootScope.JSONWebToken = response.data["token"];
                localStorage.setItem("JSONWebToken", $rootScope.JSONWebToken);
                console.log("Login successful: " + $rootScope.JSONWebToken);
                $rootScope.loggedIn = true;
                $scope.username = "";
                $scope.password = "";
            }, function error(response) {
                console.log("Error logging in: " + response.status);
                if (response.data && response.data["non_field_errors"]) {
                    for (i = 0; i < response.data["non_field_errors"].length; i++) {
                        $scope.loginWarningField = response.data["non_field_errors"];
                        console.log(response.data["non_field_errors"][i]);
                    }
                }
                $scope.status = status;
            }
        );
    };

    /**
     * Test current auth token
     */
    var authVerifyPromise = loginService.auth_verify();
    authVerifyPromise.then(
        function success(response) {
            console.log("Auth valid: " + $rootScope.JSONWebToken);
            $rootScope.loggedIn = true;
        }, function error(response) {
            console.log("Auth invalid: " + response.status);
            $rootScope.loggedIn = false;
        }
    );

    /**
     * Logs user out, displays login page.
     */
    $scope.logout = function () {
        localStorage.removeItem("JSONWebToken");
        $location.path('');
    };

    // enables autofocus in IE
    $(function () {
        $('[autofocus]:not(:focus)').eq(0).focus();
    });

    $(document).ready(function () {
        $(".navbar-toggle").on("click", function () {
            $(this).toggleClass("active");
        });
    });

});
