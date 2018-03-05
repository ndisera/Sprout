app.controller("notificationsController", function ($scope, $location, $q, userService, data) {
    $scope.location = $location;

    $scope.categories = {
        '1': 'birthday',
    }

    $scope.notifications = userService.notificationData.relevantItems;

    $scope.singleColumn = $scope.notifications;
    $scope.doubleColumn = [[], [], ];
    $scope.tripleColumn = [[], [], [], ];


    $scope.updateNotifications = function() {
        for(var i = 0; i < $scope.doubleColumn.length; ++i) {
            $scope.doubleColumn[i].length = 0;
        }
        for(var i = 0; i < $scope.tripleColumn.length; ++i) {
            $scope.tripleColumn[i].length = 0;
        }

        for(var i = 0; i < $scope.notifications.length; i += 2) {
            for(var j = 0; j < 2; j++) {
                if((i + j) < $scope.notifications.length) {
                    $scope.doubleColumn[j].push($scope.notifications[i + j]);
                }
            }
        }

        for(var i = 0; i < $scope.notifications.length; i += 3) {
            for(var j = 0; j < 3; j++) {
                if((i + j) < $scope.notifications.length) {
                    $scope.tripleColumn[j].push($scope.notifications[i + j]);
                }
            }
        }
    }

    $scope.navigate = function(notification) {
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
                    function success() {
                        $scope.updateNotifications();
                    },
                    function error() {},
                );
            });
    }

    $scope.updateNotifications();
});
