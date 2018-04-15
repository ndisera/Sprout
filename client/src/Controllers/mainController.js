app.controller('mainController', function ($scope, $rootScope, $location, $q, $timeout, userService, studentService) {
    $scope.location = $location;

    $scope.user = userService.user;
    $scope.studentInfo = studentService.studentInfo;

    $scope.sidebarExtended = false;
    $scope.showNotifications = false;

    $scope.notifications = userService.notificationData.relevantItems;

    $scope.searchString          = '';
    $scope.activeSearchLinkIndex = 0;

    var defaultSearchPlaceholder = 'Search...';
    $scope.searchPlaceHolder = defaultSearchPlaceholder;

    $scope.showSearchResults = false;

    var maxResults = 3;
    var widthOfSpace = 2.8125;
    var keyCodes = {
        up: 38,
        down: 40,
    };

    $scope.searchLinkTypes = {
        student: 0,
        studentPage: 1,
        otherPage: 2,
    };

    $scope.activeSearchLink = {
        id: null,
        type: null,
    };

    $scope.studentPages = [
        {
            uniqueKey: 0,
            str: 'tests',
            href: '/tests',
            title: 'Test Scores',
        },
        {
            uniqueKey: 1,
            str: 'grades',
            href: '/grades',
            title: 'Grades',
        },
        {
            uniqueKey: 2,
            str: 'attendances',
            href: '/attendance',
            title: 'Attendance',
        },
        {
            uniqueKey: 3,
            str: 'behaviors',
            href: '/behaviors',
            title: 'Behavior',
        },
        {
            uniqueKey: 4,
            str: 'ieps',
            href: '/ieps',
            title: 'IEP',
        },
        {
            uniqueKey: 4,
            str: 'goals',
            href: '/ieps',
            title: 'IEP Goals',
        },
        {
            uniqueKey: 5,
            str: 'services',
            href: '/services',
            title: 'Service Requirements',
        },
    ];

    $scope.otherPages = [
        {
            uniqueKey: 0,
            str: 'home',
            href: '/profile/focus',
            title: 'Home',
        },
        {
            uniqueKey: 0,
            str: 'profile',
            href: '/profile/focus',
            title: 'My Profile',
        },
        {
            uniqueKey: 0,
            str: 'focus',
            href: '/profile/focus',
            title: 'My Focus Students',
        },
        {
            uniqueKey: 1,
            str: 'students',
            href: '/profile/students',
            title: 'My Students',
        },
        {
            uniqueKey: 2,
            str: 'inputs',
            href: '/input',
            title: 'Input Scores',
        },
        {
            uniqueKey: 3,
            str: 'behaviors',
            href: '/input/behavior',
            title: 'Input Behavior Scores',
        },
        {
            uniqueKey: 4,
            str: 'tests',
            href: '/input/tests',
            title: 'Input Test Scores',
        },
        {
            uniqueKey: 5,
            str: 'reports',
            href: '/reports',
            title: 'Generate Reports',
        },
        {
            uniqueKey: 6,
            str: 'tests',
            href: '/reports/tests',
            title: 'Generate Test Reports',
        },
        {
            uniqueKey: 7,
            str: 'services',
            href: '/reports/services',
            title: 'Generate Service Reports',
        },
        {
            uniqueKey: 8,
            str: 'settings',
            href: '/settings/user',
            title: 'My Settings',
        },
        {
            uniqueKey: 9,
            str: 'feedback',
            href: '/feedback',
            title: 'Provide Feedback',
        },
    ];

    $scope.studentResults      = [];
    $scope.studentPagesResults = [];
    $scope.otherPagesResults   = [];

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
        $scope.searchString = '';
        $scope.focusSearch(null, false);
        $('#search-input').blur();
    };

    $scope.focusSearch = function(event, focused) {
        if(focused) {
            $scope.updateSearch();
            $scope.showSearchResults = focused;
        }
        else {
            $timeout(function() {
                $scope.showSearchResults = focused;
                $scope.activeSearchLink = {
                    id: null,
                    type: null,
                };
                $scope.searchPlaceHolder = defaultSearchPlaceholder;
                $scope.searchString = '';
            }, 250);
        }
    };

    $scope.updateSearch = function() {
        var searchStrings = $scope.searchString.split(' ');
        _.each(searchStrings, function(elem) { elem = elem.toLowerCase(); });

        var studentSet = {};

        $scope.studentResults      = [];
        $scope.studentPagesResults = [];
        $scope.otherPagesResults   = [];

        // search full name first, should be top of list
        _.each($scope.studentInfo.students, function(elem) {
            var fullName = elem.first_name + ' ' + elem.last_name;
            fullName = fullName.toLowerCase();
            if(fullName.includes($scope.searchString.toLowerCase())) {
                $scope.studentResults.push({
                    id: elem.id,
                    first_name: elem.first_name,
                    last_name: elem.last_name,
                    title: elem.first_name + ' ' + elem.last_name + ' (' + elem.student_id + ')',
                    href: '/student/' + elem.id,
                    type: $scope.searchLinkTypes['student'],
                });

                // mark that it's in the results already
                studentSet[elem.id] = { studentPages: {}, };
            }
        });

        // next search first or last name with split search results
        _.each(searchStrings, function(elem) {
            var matchingStudents = _.filter($scope.studentInfo.students, function(student) {
                var firstName = student.first_name.includes(elem);
                var lastName = student.last_name.includes(elem);
                var studentId = student.student_id.includes(elem);
                var birthdate = student.birthdate.includes(elem);

                return (firstName || lastName || studentId || birthdate);
            });

            // add everything that matched
            _.each(matchingStudents, function(student) {
                if(!studentSet[student.id]) {
                    $scope.studentResults.push({
                        id: student.id,
                        first_name: elem.first_name,
                        last_name: elem.last_name,
                        title: student.first_name + ' ' + student.last_name + ' (' + student.student_id + ')',
                        href: '/student/' + student.id,
                        type: $scope.searchLinkTypes['student'],
                    });
                    studentSet[student.id] = { studentPages: {}, };
                }
            });
        });

        // now check for matching student page strings
        _.each(searchStrings, function(elem) {
            var matchingPages = [];
            _.each($scope.studentPages, function(page) {
                if(page.str.includes(elem)) {
                    matchingPages.push(page);
                }
            });

            var id = 0;
            // for each student, for each student page match, push a matching "student page" result
            _.each($scope.studentResults, function(student) {
                _.each(matchingPages, function(page) {
                    if(!studentSet[student.id].studentPages[page.uniqueKey]) {
                        $scope.studentPagesResults.push({
                            id: id,
                            student: student.id,
                            title: student.first_name + ' ' + student.last_name + '\'s ' + page.title + ' page',
                            href: '/student/' + student.id + page.href,
                            type: $scope.searchLinkTypes['studentPage'],
                        });
                        studentSet[student.id].studentPages[page.uniqueKey] = true;
                        id++;
                    }
                });
            });
        });

        var otherPagesSet = {};
        var id = 0;
        // now check for site-wide pages
        _.each(searchStrings, function(elem) {
            _.each($scope.otherPages, function(page) {
                if(!otherPagesSet[page.uniqueKey] && page.str.includes(elem)) {
                    $scope.otherPagesResults.push({
                        id: id,
                        title: page.title,
                        href: page.href,
                        type: $scope.searchLinkTypes['otherPage'],
                    });
                    otherPagesSet[page.uniqueKey] = true;
                    id++;
                }
            });
        });

        // now select the active link
        if($scope.studentResults.length > 0) {
            $scope.activeSearchLink = $scope.studentResults[0];
            $scope.activeSearchLink.type = $scope.searchLinkTypes['student'];
        }
        else if($scope.studentPagesResults.length > 0) {
            $scope.activeSearchLink = $scope.studentPagesResults[0];
            $scope.activeSearchLink.type = $scope.searchLinkTypes['studentPage'];
        }
        else if($scope.otherPagesResults.length > 0) {
            $scope.activeSearchLink = $scope.otherPagesResults[0];
            $scope.activeSearchLink.type = $scope.searchLinkTypes['otherPage'];
        }
        else {
            $scope.activeSearchLink = {
                id: null,
                type: null,
            };
        }

        $scope.searchPlaceHolder     = getPlaceholder($scope.searchString);
        $scope.activeSearchLinkIndex = 0;
    };

    $scope.navigateToStudent = function(link) {
        if(link) {
            $location.path(link);
        }
        else {
            $location.path($scope.activeSearchLink.href);
        }
        $scope.clearSearch();
    };

    function getLastResult(arr, max) {
        if(arr.length < max) {
            return arr[arr.length - 1];
        }
        else {
            return arr[max - 1];
        }
    }

    $scope.searchMouseOver = function(entry, type) {
        $scope.activeSearchLink = entry;
        $scope.searchPlaceHolder = getPlaceholder($scope.searchString);

        // now I need to update the active search link index
        var iterIndex     = 0;
        var studentsToAdd = $scope.studentResults.length > maxResults ? maxResults : $scope.studentResults.length;
        for(var i = 0; i < studentsToAdd; ++i) {
            if(entry.id === $scope.studentResults[i].id && entry.type === $scope.studentResults[i].type) {
                $scope.activeSearchLinkIndex = iterIndex;
                return;
            }
            iterIndex++;
        }

        var studentPagesToAdd = $scope.studentPagesResults.length > maxResults ? maxResults : $scope.studentPagesResults.length;
        for(var i = 0; i < studentPagesToAdd; ++i) {
            if(entry.id === $scope.studentPagesResults[i].id && entry.type === $scope.studentPagesResults[i].type) {
                $scope.activeSearchLinkIndex = iterIndex;
                return;
            }
            iterIndex++;
        }

        var otherPagesToAdd = $scope.otherPagesResults.length > maxResults ? maxResults : $scope.otherPagesResults.length;
        for(var i = 0; i < otherPagesToAdd; ++i) {
            if(entry.id === $scope.otherPagesResults[i].id && entry.type === $scope.otherPagesResults[i].type) {
                $scope.activeSearchLinkIndex = iterIndex;
                return;
            }
            iterIndex++;
        }
    };

    $scope.searchKeyDown = function(event) {
        var keyCode = event.keyCode;

        var updateActiveSearchLink = function(link, type, idx) {
            $scope.activeSearchLink = link;
            $scope.activeSearchLinkIndex = idx;
            $scope.searchPlaceHolder = getPlaceholder($scope.searchString);
        };

        if(keyCode === keyCodes.up) {
            event.preventDefault();

            if($scope.activeSearchLinkIndex === 0) {
                return;
            }

            $scope.activeSearchLinkIndex--;

            var iterIndex     = 0;
            var studentsToAdd = $scope.studentResults.length > maxResults ? maxResults : $scope.studentResults.length;
            for(var i = 0; i < studentsToAdd; ++i) {
                if(iterIndex === $scope.activeSearchLinkIndex) {
                    updateActiveSearchLink($scope.studentResults[i], 'student', $scope.activeSearchLinkIndex);
                    return;
                }
                iterIndex++;
            }

            var studentPagesToAdd = $scope.studentPagesResults.length > maxResults ? maxResults : $scope.studentPagesResults.length;
            for(var i = 0; i < studentPagesToAdd; ++i) {
                if(iterIndex === $scope.activeSearchLinkIndex) {
                    updateActiveSearchLink($scope.studentPagesResults[i], 'studentPage', $scope.activeSearchLinkIndex);
                    return;
                }
                iterIndex++;
            }

            var otherPagesToAdd = $scope.otherPagesResults.length > maxResults ? maxResults : $scope.otherPagesResults.length;
            for(var i = 0; i < otherPagesToAdd; ++i) {
                if(iterIndex === $scope.activeSearchLinkIndex) {
                    updateActiveSearchLink($scope.otherPagesResults[i], 'otherPage', $scope.activeSearchLinkIndex);
                    return;
                }
                iterIndex++;
            }
        }
        else if(keyCode === keyCodes.down) {
            event.preventDefault();

            var temp = $scope.activeSearchLinkIndex + 1;

            var iterIndex     = 0;
            var studentsToAdd = $scope.studentResults.length > maxResults ? maxResults : $scope.studentResults.length;
            for(var i = 0; i < studentsToAdd; ++i) {
                if(iterIndex === temp) {
                    updateActiveSearchLink($scope.studentResults[i], 'student', temp);
                    return;
                }
                iterIndex++;
            }

            var studentPagesToAdd = $scope.studentPagesResults.length > maxResults ? maxResults : $scope.studentPagesResults.length;
            for(var i = 0; i < studentPagesToAdd; ++i) {
                if(iterIndex === temp) {
                    updateActiveSearchLink($scope.studentPagesResults[i], 'studentPage', temp);
                    return;
                }
                iterIndex++;
            }

            var otherPagesToAdd = $scope.otherPagesResults.length > maxResults ? maxResults : $scope.otherPagesResults.length;
            for(var i = 0; i < otherPagesToAdd; ++i) {
                if(iterIndex === temp) {
                    updateActiveSearchLink($scope.otherPagesResults[i], 'otherPage', temp);
                    return;
                }
                iterIndex++;
            }
        }

    };

    function getMaxResultsDisplayed() {
        var studentsToAdd     = $scope.studentResults.length > maxResults ? maxResults : $scope.studentResults.length;
        var studentPagesToAdd = $scope.studentPagesResults.length > maxResults ? maxResults : $scope.studentPagesResults.length;
        var otherPagesToAdd   = $scope.otherPagesResults.length > maxResults ? maxResults : $scope.otherPagesResults.length;

        return studentsToAdd + studentPagesToAdd + otherPagesToAdd;
    }

    /**
     * calculates padding to make sure arrow comes after search string
     */
    function getPlaceholder(str) {
        if($scope.activeSearchLink.id === null) {
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
        
        placeholder += '     →     ' + $scope.activeSearchLink.title;
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
