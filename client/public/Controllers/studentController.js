app.controller("studentController", function ($scope, $location, $http, $rootScope, $routeParams) {

    $scope.classes = [];
    $scope.class_titles = [];
    $scope.behaviors = [];

    // get student's classes
    $http({
        method: 'GET',
        url: 'http://localhost:8000/enrollments/?student=' + $rootScope.student.id
    }).then(function successCallback(response) {
        // enrollments will contain section id (for mapping to enrollments) and student id
        $scope.enrollments = response.data;
        $scope.classes = [];
        var index = 0;
        for (var i = 0; i < $scope.enrollments.length; i++) {
            $http({
                method: 'GET',
                url: 'http://localhost:8000/sections/?section=' + $scope.enrollments[i].section
            }).then(function successCallback(response) {
                $scope.classes.push({
                    id: response.data[index].id,
                    title: response.data[index].title
                });
                $scope.class_titles.push(
                    response.data[index++].title
                );
                var x = $scope.classes;
            }, function errorCallback(response) {
                $scope.status = response.status;
            });

        }
    }, function errorCallback(response) {
        $scope.status = response.status;
    });

    //// the classes array should now contain objects with teacher and title


    // get behavior scores
    // pass in student, start date, and end date
    $scope.getBehaviors = function () {
        $http({
            method: 'GET',
            url: "http://localhost:8000/behaviors/?student=" + $scope.student.id + "&start_date=" + $scope.behaviorDate + "&end_date=" + $scope.behaviorDate
        }).then(function successCallback(response) {
            $scope.behaviors = response.data;
            $scope.classBehaviorScores = {};
            var index = 0;
            for (var i = 0; i < $scope.behaviors.length; i++) {
                $scope.classBehaviorScores[response.data[i].enrollment.id] = {
                    behavior: response.data[i].behavior,
                    effort: response.data[i].effort
                }
            }
            

            // now I should be able to match each behavior and effort score to each class
        }, function errorCallback(response) {
            $scope.status = response.status;
        });
    }

    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }

    $('#datepicker').datepicker({
        format: "yyyy-mm-dd"
    });

    function defaultDate() {
        var date = new Date();
        // prepend 0 to single digit day
        var day = "";
        if (date.getDate() < 10) {
            day = "0" + date.getDate();
        }
        $scope.behaviorDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + day;
    }

    defaultDate();

    $scope.changeDate = function () {
        // set select boxes back to one
        var temp = "";
        $(".effortScore").val("");
        $(".behaviorScore").val("");
    }

    $('#datepicker').datepicker().on('changeDate', function (ev) {
        $scope.changeDate();
    });
    $scope.data = [
        [65, 59, 80, 81, 56, 55, 40]
    ];
    $scope.onClick = function (points, evt) {
        console.log(points, evt);
    };
    $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }];
    $scope.options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            yAxes: [
                {
                    id: 'y-axis-1',
                    type: 'linear',
                    display: true,
                    position: 'left'
                }
            ]
        }
    };
});
