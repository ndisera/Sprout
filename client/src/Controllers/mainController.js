app.controller('mainController', function ($scope, $rootScope, $location, studentService) {

    /**
     *  Used to determine where to make calls to the backend
     */
    $rootScope.backendHostname = $location.host();

    /**
     *  Used to determine how to make calls to the backend
     */
    $rootScope.backendPort = 8000;

    /**
     *  Convenience variable - Combine backendHostname and backendPort in a manner which
     *  they will often be used
     */
    $rootScope.backend = $rootScope.backendHostname + ':' + $rootScope.backendPort

    $scope.studentInfo = studentService.studentInfo;

    studentService.refreshStudents();

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

    // checks local stroage to see if user has logged in recently and redirects to focus page if so
    $rootScope.loggedIn = JSON.parse(localStorage.getItem("loggedIn"));
    if ($rootScope.loggedIn === null)
        $rootScope.loggedIn = false;
    else if ($rootScope.loggedIn && $location.path() === "")
        $location.path('/focus');

    /**
     * Checks login credentials and logs the user in if valid.
     */
    $scope.attemptLogin = function () {
        if (($scope.username === "ndisera" || $scope.username === "sredman" || $scope.username === "gwatson" || $scope.username === "gzuber") && $scope.password === "password") {
            $rootScope.loggedIn = true;
            localStorage.setItem("loggedIn", true);
        }
        $scope.username = "";
        $scope.password = "";
    };

    /**
     * Logs user out, displays login page.
     */
    $scope.logout = function () {
        console.log($scope.testValueThing);
        $rootScope.loggedIn = false;
        localStorage.setItem("loggedIn", false);
        $location.path('')
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
