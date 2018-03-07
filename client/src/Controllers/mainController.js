app.controller('mainController', function ($scope, $rootScope, $location, userService, studentService) {
    $scope.location = $location;

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
            href: "/profile",
            click: $scope.clearSearch,
            badgeList: [],
        },
        {
            title: "Manage",
            glyph: "briefcase",
            href: "/manage",
            click: $scope.clearSearch,
            badgeList: [],
        },
        //{
            //title: "Scores Input",
            //glyph: "pencil",
            //href: "/input",
            //click: $scope.clearSearch,
            //badgeList: [],
        //},
        {
            title: "Notifications",
            glyph: "bell",
            href: "/notifications",
            click: $scope.clearSearch,
            badgeList: userService.notificationData.relevantItems,
        },
        {
            title: "Settings",
            glyph: "cog",
            href: "/settings",
            click: $scope.clearSearch,
            badgeList: [],
        },
        {
            title: "Logout",
            glyph: "log-out",
            href: "/login",
            click: "logout(); $scope.clearSearch();",
            click: $scope.logout,
            badgeList: [],
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

    $rootScope.$on('user:auth', function(event, data) {
        if(data.type === 'login') {
            userService.getAllNotificationsForUser(userService.user.id, null).then(
                function success(data) {},
                function error(response) {},
            );
        }
    });

    // closes navbar when an element is clicked in tablet/mobile view
    //$('.nav a').on('click', function () {
        //$scope.closeNavbar();
    //});

    /**
     * Navigates to student's page if name in navigation search bar is valid.
     */
    $scope.tryNavigateToStudent = function() {
        if ($scope.studentName.toUpperCase() in $scope.studentInfo.studentsLookup) {
            $location.path('/student/' + $scope.studentInfo.studentsLookup[$scope.studentName.toUpperCase()].id);
            $scope.clearSearch();
        }
        else {
            //TODO: notify the user in some way
        }
    };


    // enables autofocus in IE
    $(function () {
        $('[autofocus]:not(:focus)').eq(0).focus();
    });

});
