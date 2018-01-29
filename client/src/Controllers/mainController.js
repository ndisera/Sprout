app.controller('mainController', function ($scope, $rootScope, $location, userService, studentService) {

    $scope.user = userService.user;
    $scope.studentInfo = studentService.studentInfo;

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

    /**
     * Logs user out
     */
    $scope.logout = function () {
        userService.logout();
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
