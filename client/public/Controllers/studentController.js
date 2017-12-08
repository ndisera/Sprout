app.controller("studentController", function ($scope, $location, $http, $rootScope, $routeParams) {

    $scope.classes = [];
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
                    title: response.data[index++].title
                });
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

    var ctx = document.getElementById("myChart").getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
});
