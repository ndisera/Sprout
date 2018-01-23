app.controller('mainController', function ($scope, $rootScope, $location, studentService, loginService) {

    /**
     *  Used to determine where to make calls to the backend
     *
     * @type {string}
     */
    $rootScope.backendHostname = $location.host();

    /**
     *  Used to determine how to make calls to the backend
     *
     * @type {number}
     */
    $rootScope.backendPort = 8000;

    /**
     *  Convenience variable - Combine backendHostname and backendPort in a manner which
     *  they will often be used
     *
     * @type {string}
     */
    $rootScope.backend = $rootScope.backendHostname + ':' + $rootScope.backendPort


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

    // get all students
    var studentsPromise = studentService.getStudents();
    studentsPromise.then(function success(data) {
        $scope.students = data;
        $scope.studentsLookup = {};

        // create fast lookup dictionary
        for (var i = 0; i < $scope.students.length; ++i) {
          var lookupName = $scope.students[i].first_name + " " + $scope.students[i].last_name;
          $scope.studentsLookup[lookupName.toUpperCase()] = $scope.students[i];
        }
    }, function error(code) {
        //TODO: deal with errors
    });

    /**
     * Navigates to student's page if name in navigation search bar is valid.
     */
    $scope.tryNavigateToStudent = function() {
        if ($scope.studentName.toUpperCase() in $scope.studentsLookup) {
            $location.path('/student/' + $scope.studentsLookup[$scope.studentName.toUpperCase()].id);
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

    // Try to refresh the JSON token to see if it is valid...
    var refreshPromise = loginService.refreshToken($rootScope.JSONWebToken);
    refreshPromise.then(
        function success(response) {
            // Yay! The token was valid, update our local knowledge to the new one
            $rootScope.JSONWebToken = response.data["token"];
            localStorage.setItem("JSONWebToken", $rootScope.JSONWebToken);
            console.log("Auth token refreshed: " + $rootScope.JSONWebToken);
            $rootScope.loggedIn = true;
        }, function error(response) {
            // Need to get a new token. Show the login screen
            $rootScope.loggedIn = false;
        }
    );

    if ($rootScope.loggedIn && $location.path() === "")
        $location.path = '/focus';

    /**
     * Checks login credentials and logs the user in if valid.
     */
    $scope.attemptLogin = function () {
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
                console.log(response.data["non_field_errors"]);
                $scope.status = status;
            }
        );
    };

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
