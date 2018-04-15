app.controller('mainController', function ($scope, $rootScope, $location, $q, $document, userService, studentService) {
    $scope.location = $location;

    $scope.user = userService.user;
    $scope.studentInfo = studentService.studentInfo;

    $scope.sidebarExtended = false;
    $scope.showNotifications = false;

    $scope.notifications = userService.notificationData.relevantItems;

    //TODO(gzuber): fix
    //$scope.showSearchResults = true;
    $scope.showSearchResults = true;

    var widthOfSpace = 2.8125;

    var keyCodes = {
        up: 38,
        down: 40,
    };

    $scope.activeSearchLink = {
        id: null,
        type: null,
    };

    $scope.studentPages = {
        'tests': {
            href: '/tests',
        },
        'grades': {
            href: '/grades',
        },
        'attendances': {
            href: '/attendance',
        },
        'behaviors': {
            href: '/behaviors',
        },
        'ieps': {
            href: '/ieps',
        },
        'goals': {
            href: '/ieps',
        },
        'services': {
            href: '/services',
        },
    };

    $scope.otherPages = {
        'home': {
            href: '/profile/focus',
        },
        'profile': {
            href: '/profile/focus',
        },
        'focus': {
            href: '/profile/focus',
        },
        'students': {
            href: '/profile/students',
        },
        'inputs': {
            href: '/input/behavior',
        },
        'behaviors': {
            href: '/input/behavior',
        },
        'tests': {
            href: '/input/tests',
        },
        'ieps': {
            href: '/ieps',
        },
        'goals': {
            href: '/ieps',
        },
        'services': {
            href: '/services',
        },
    };

    /**
     * Toggles the sidebar
     */
    $scope.toggleSidebar = function(value) {
        $scope.sidebarExtended = value;
    };

    /**
     * Toggles the notifications try
     */
    $scope.toggleNotifications = function(value) {
        $scope.showNotifications = value;
    };

    /**
     * Clears the main navigation search bar.
     */
    $scope.clearSearch = function () {
        $scope.studentName = "";
    };

    $scope.focusSearch = function(event, focused) {
        // TODO(gzuber): fix
        //$scope.showSearchResults = focused;
        $scope.showSearchResults = true;
    };

    $scope.updateSearch = function() {
        $scope.searchPlaceHolder = getPlaceholder($scope.searchString);

    };

    $scope.searchKeyUp = function(event) {
        var keyCode = event.keyCode;
        if(keyCode === keyCodes.up) {
            event.preventDefault();
            console.log($scope.studentFilterResults);
        }
        else if(keyCode === keyCode.down) {
            event.preventDefault();
            console.log($scope.studentFilterResults);
        }
    };

    $scope.studentFilter = function(student) { 
        if(_.find($scope.students, function(elem) { return elem.student_id.includes($scope.searchString);})) {
            return true;
        }
        if($scope.searchString === null || $scope.searchString === undefined) {
            return true;
        }
        var input = $scope.searchString.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if(student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || student.birthdate.toUpperCase().includes(input) ||
            fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    };

    /**
     * calculates padding to make sure arrow comes after search string
     */
    function getPlaceholder(str) {
        if(str === '') {
            return '';
        }

        if(!$scope.searchMeasure) {
            $scope.searchMeasure = $('<span style="white-space: pre;">').hide().appendTo(document.body);
        }

        $scope.searchMeasure.text(str);

        var width = $scope.searchMeasure.width();
        var placeholder = '';

        var iter = 0;
        while(iter < width) {
            placeholder += ' ';
            iter += widthOfSpace;
        }
        placeholder += '     →';
        return placeholder;
    }

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
            href: "/profile/focus",
            click: $scope.clearSearch,
            badgeList: [],
            adminRequired: false,
        },
        {
            title: "Students",
            glyph: "leaf",
            href: "/profile/students",
            click: $scope.clearSearch,
            badgeList: [],
            adminRequired: false,
        },
        {
            title: "Input Scores",
            glyph: "pencil",
            href: "/input",
            click: $scope.clearSearch,
            badgeList: [],
            adminRequired: false,
        },
        {
            title: "Reports",
            glyph: "list-alt",
            href: "/reports",
            click: $scope.clearSearch,
            badgeList: [],
            adminRequired: false,
        },
        // {
        //     title: "Services",
        //     glyph: "list",
        //     href: "/services",
        //     click: $scope.clearSearch,
        //     badgeList: [],
        //     adminRequired: false,
        // },
        {
            title: "Manage",
            glyph: "briefcase",
            href: "/manage",
            click: $scope.clearSearch,
            badgeList: [],
            adminRequired: true,
        },
        {
            title: "Settings",
            glyph: "cog",
            href: "/settings",
            click: $scope.clearSearch,
            badgeList: [],
            adminRequired: false,
        },
        {
            title: "Feedback",
            glyph: "comment",
            href: "/feedback",
            click: $scope.clearSearch,
            badgeList: [],
            adminRequired: false,
        },
        {
            title: "Logout",
            glyph: "log-out",
            href: "/login",
            click: "logout(); $scope.clearSearch();",
            click: $scope.logout,
            badgeList: [],
            adminRequired: false,
        },
    ];

    $scope.sidebarLinkActive = function(link) {
        if(link.href === '/profile/students') {
            if($location.path().split('/')[1] === 'student' ||
                ($location.path().split('/')[1] === link.href.split('/')[1] && $location.path().split('/')[2] === link.href.split('/')[2])) {
                return true;
            }
        }
        else if(link.href === '/profile/focus') {
            if($location.path().split('/')[1] === link.href.split('/')[1] && $location.path().split('/')[2] === link.href.split('/')[2]) {
                return true;
            }
        }
        else {
            if($location.path().split('/')[1] === link.href.split('/')[1]) {
                return true;
            }
        }
        return false;
    };

    $scope.sidebarLinkClick = function(link) {
        link.click();
        $scope.toggleSidebar(false);
    };

    $rootScope.$on('user:auth', function(event, data) {
        if(data.type === 'login') {
            userService.getAllNotificationsForUser(userService.user.id, null).then(
                function success(data) {},
                function error(response) {}
            );
        }
    });

    /**
     * Navigates to student's page if name in navigation search bar is valid.
     */
    $scope.tryNavigateToStudent = function() {
        if($('#topbar select.polyfilling').length === 0) {
            if ($scope.studentName.toUpperCase() in $scope.studentInfo.studentsLookup) {
                $location.path('/student/' + $scope.studentInfo.studentsLookup[$scope.studentName.toUpperCase()].id);
                $scope.clearSearch();
            }
            else {
                //TODO: notify the user in some way
            }
        }
        // for safari datalist alternative
        else {
            var searchText = $('#topbar select.polyfilling').find(':selected').text().trim().toUpperCase();
            if(searchText in $scope.studentInfo.studentsLookup) {
                $scope.clearSearch();
                $('#topbar select.polyfilling').find(':selected').removeAttr('selected');
                $location.path('/student/' + $scope.studentInfo.studentsLookup[searchText].id);
            }
            else {
                //TODO: notify the user in some way
            }
        }
    };


    // enables autofocus in IE
    $(function () {
        $('[autofocus]:not(:focus)').eq(0).focus();
    });

    /*** NOTIFICATIONS ***/
    $scope.notificationsCategories = {
        1: {
            panelClass: 'notifications-birthday',
            iconClass: 'fa-birthday-cake',
        },
        2: {
            panelClass: 'notifications-low-grade',
            iconClass: 'fa-exclamation-triangle',
        },
        3: {
            panelClass: 'notifications-iep-goal',
            iconClass: 'fa-chart-line',
        },
    }

    $scope.notificationClass = function(notification) {
        return $scope.notificationsCategories[notification.category].panelClass;
    };

    $scope.notificationIconClass = function(notification) {
        return $scope.notificationsCategories[notification.category].iconClass;
    };

    $scope.notificationNavigate = function(notification) {
        $scope.toggleNotifications(false);
        $location.path('/student/' + notification.student + notification.partial_link);
    };

    $scope.markAsRead = function(notification, command) {
        var notificationsToRead = [];
        if(command === 'all') {
            _.each($scope.notifications, function(elem) {
                var editedNotification = _.clone(elem);
                editedNotification.unread = false;
                notificationsToRead.push(editedNotification);
            });
        }
        else {
            var editedNotification = _.clone(notification);
            editedNotification.unread = false;
            notificationsToRead.push(editedNotification);

        }

        var promises = [];
        _.each(notificationsToRead, function(elem) {
            promises.push(userService.updateNotificationForUser(userService.user.id, elem.id, elem));
        });

        $q.all(promises)
            .then(function() {
                userService.getAllNotificationsForUser(userService.user.id).then(
                    function success() {},
                    function error() {}
                );
            });
    }

    // some of the hackiest nonsense I've ever done
    // close notifications if the user clicks anywhere on the screen
    // notifications panel will cancel the event before it bubbles up
    // to body
    $('body').click(function() {
        var scope = angular.element($('#nav-wrapper')).scope();
        scope.$apply(function() {
            scope.toggleNotifications(false);
        });
    });

});
