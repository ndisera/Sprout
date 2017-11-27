app.controller('mainController', function ($scope, $location) {

    $scope.loggedIn = false;

    $scope.attemptLogin = function (event) {
        if (($scope.username === "ndisera" || $scope.username === "sredman" || $scope.username === "gwatson" || $scope.username === "gzuber") && $scope.password === "password") {
            $scope.loggedIn = true;
        }
        $scope.username = "";
        $scope.password = "";
        event.preventDefault();
    };

    $scope.logout = function () {
        $scope.loggedIn = false;
    }

    $(document).ready(function () {
        $(".navbar-toggle").on("click", function () {
            $(this).toggleClass("active");
        });
    });

    $scope.getProfile = function () {
        if ($scope.studentName === "Nico DiSera" || $scope.studentName === "Simon Redman" || $scope.studentName === "Guy Watson" || $scope.studentName === "Graham Zuber")
            $location.path('/student')
    };

    $scope.clearSearch = function () {
        $scope.studentName = ""
    };

});