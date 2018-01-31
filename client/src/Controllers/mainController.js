app.controller('mainController', function ($scope, $rootScope, $location, userService, studentService) {

    $scope.user = userService.user;
    $scope.studentInfo = studentService.studentInfo;

    /**
     * Toggles navbar if it isn't collapsed and has a window width < 768px
     */
    $scope.closeNavbar = function () {
        if ($(".navbar-toggle").hasClass("collapsed")) {
            // Closed
        } else {
            // Open
            if (window.innerWidth < 768) {
                $('.btn-navbar').click(); //bootstrap 2.x
                $('.navbar-toggle').click() //bootstrap 3.x by Richard
            }
        }
    }

    // closes navbar when an element is clicked in tablet/mobile view
    $('.nav a').on('click', function () {
        $scope.closeNavbar();
    });

    /**
     * Navigates to student's page if name in navigation search bar is valid.
     */
    $scope.tryNavigateToStudent = function() {
        if ($scope.studentName.toUpperCase() in $scope.studentInfo.studentsLookup) {
            $location.path('/student/' + $scope.studentInfo.studentsLookup[$scope.studentName.toUpperCase()].id);
            $scope.clearSearch();
            $scope.closeNavbar();
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
