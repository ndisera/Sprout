app.controller('mainController', function ($scope, $location) {

    $(document).ready(function () {
        $(".navbar-toggle").on("click", function () {
            $(this).toggleClass("active");
        });
    });

    $scope.getProfile = function () {
        if ($scope.studentName === "Nico DiSera")
            $location.path('/student')
    }

});