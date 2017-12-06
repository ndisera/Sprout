app.controller('mainController', function ($scope, $location, $http) {

    $http({
        method: 'GET',
        url: 'http://localhost:8000/students/'
    }).then(function successCallback(response) {
        $scope.students = response.data;
        $scope.studentNames = []
        for (var i = 0; i < $scope.students.length; i++) {
            $scope.studentNames.push($scope.students[i].first_name + " " + $scope.students[i].last_name);
        }
    }, function errorCallback(response) {
        $scope.status = response.status;
    });

    $scope.loggedIn = JSON.parse(localStorage.getItem("loggedIn"))
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
        for (var i = 0; i < $scope.studentNames.length; i++) {
            if ($scope.studentNames[i] === $scope.studentName) {
                $location.path('/student');
                return;
            }
        }
    };

    $scope.clearSearch = function () {
        $scope.studentName = ""
    };

});