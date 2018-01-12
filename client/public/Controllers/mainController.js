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

    $scope.tryNavigateToStudent = function() {
        if ($scope.studentName.toUpperCase() in $scope.studentsLookup) {
            $location.path('/student/' + $scope.studentsLookup[$scope.studentName.toUpperCase()].id);
            return;
        }
        else {
            //TODO: notify the user in some way
        }
    };

    $scope.clearSearch = function () {
        $scope.studentName = ""
    };

    $rootScope.loggedIn = JSON.parse(localStorage.getItem("loggedIn"));
    if ($rootScope.loggedIn === null)
        $rootScope.loggedIn = false;
    else if ($rootScope.loggedIn && $location.path() === "")
        $location.path('/focus');

    $scope.attemptLogin = function () {
        if (($scope.username === "ndisera" || $scope.username === "sredman" || $scope.username === "gwatson" || $scope.username === "gzuber") && $scope.password === "password") {
            $rootScope.loggedIn = true;
            localStorage.setItem("loggedIn", true);
        }
        $scope.username = "";
        $scope.password = "";
    };

    $scope.logout = function () {
        console.log($scope.testValueThing);
        $rootScope.loggedIn = false;
        localStorage.setItem("loggedIn", false);
        $location.path('')
    };

    // for autofocus in ie
    $(function () {
        $('[autofocus]:not(:focus)').eq(0).focus();
    });

    $(document).ready(function () {
        $(".navbar-toggle").on("click", function () {
            $(this).toggleClass("active");
        });
    });

});
