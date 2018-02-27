app.controller('mainController', function ($scope, $rootScope, $location, userService, studentService) {

    $scope.user = userService.user;
    $scope.studentInfo = studentService.studentInfo;

    $scope.sidebarExtended = false;

    $scope.extendSidebar = function() {
        $scope.sidebarExtended = !$scope.sidebarExtended;
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
        $scope.clearSearch();
        userService.logout();
    };

    $scope.sidebarLinks = [
        {
            title: "Home",
            glyph: "home",
            href: "/focus",
            click: $scope.clearSearch,
        },
        {
            title: "Manage",
            glyph: "briefcase",
            href: "/manage",
            click: $scope.clearSearch,
        },
        {
            title: "Scores Input",
            glyph: "pencil",
            href: "/scores",
            click: $scope.clearSearch,
        },
        {
            title: "Notifications",
            glyph: "bell",
            href: "/",
            click: $scope.clearSearch,
        },
        {
            title: "Settings",
            glyph: "cog",
            href: "/settings",
            click: $scope.clearSearch,
        },
        {
            title: "Logout",
            glyph: "log-out",
            href: "/login",
            click: "logout(); $scope.clearSearch();",
            click: $scope.logout,
        },
    ];

    $scope.sidebarLinkActive = function(link) {
        if($location.path().split('/')[1] === link.href.split('/')[1]) {
            return true;
        }
        return false;
    };

    $scope.sidebarLinkClick = function(link) {
       link.click();
    };

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
