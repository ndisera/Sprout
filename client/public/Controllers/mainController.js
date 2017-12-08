app.controller('mainController', function ($scope, $location, $http, $rootScope) {

    $http({
        method: 'GET',
        url: 'http://localhost:8000/students/'
    }).then(function successCallback(response) {
        // our collection of students
        $scope.students = response.data;
    }, function errorCallback(response) {
        $scope.status = response.status;
    });

    // this is for refresh
    if ($rootScope.student === undefined)
        $rootScope.student = JSON.parse(localStorage.getItem("lastStudent"));
    // if it's still null that's fine

    $scope.loggedIn = JSON.parse(localStorage.getItem("loggedIn"));
    if ($scope.loggedIn === null)
        $scope.loggedIn = false;
    else if ($scope.loggedIn && $location.path() == "")
        $location.path('/focus');

    $scope.attemptLogin = function () {
        if (($scope.username === "ndisera" || $scope.username === "sredman" || $scope.username === "gwatson" || $scope.username === "gzuber") && $scope.password === "password") {
            $scope.loggedIn = true;
            localStorage.setItem("loggedIn", true);
        }
        $scope.username = "";
        $scope.password = "";
    };

    $scope.logout = function () {
        $scope.loggedIn = false;
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

    $scope.getProfile = function () {
        for (var i = 0; i < $scope.students.length; i++) {
            if ($scope.students[i].first_name + " " + $scope.students[i].last_name === $scope.studentName) {
                // the currently chosen student object
                $rootScope.student = $scope.students[i];
                localStorage.setItem("lastStudent", JSON.stringify($rootScope.student));
                $location.path('/student/' + $scope.students[i].id);
                return;
            }
        }
    };

    $scope.clearSearch = function () {
        $scope.studentName = ""
    };

});
