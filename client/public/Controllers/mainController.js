app.controller('mainController', function ($scope, $location) {

    $scope.loggedIn = JSON.parse(localStorage.getItem("loggedIn"))
    if ($scope.loggedIn === null)
        $scope.loggedIn = false;

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
        if ($scope.studentName === "Nico DiSera" || $scope.studentName === "Simon Redman" || $scope.studentName === "Guy Watson" || $scope.studentName === "Graham Zuber")
            $location.path('/student')
    };

    $scope.clearSearch = function () {
        $scope.studentName = ""
    };

});