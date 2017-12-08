app.controller("studentController", function ($scope, $location, $http, $rootScope) {
    // get student's classes
    $http({
        method: 'GET',
        url: 'http://localhost:8000/enrollments/?' + $rootScope.student.id
    }).then(function successCallback(response) {
        // enrollments will contain section id (for mapping to enrollments) and student id
        $scope.enrollments = response.data;
        for (var i = 0; i < $scope.enrollments.length; i++) {
            var id = $scope.enrollments[i].id;
            $http({
                method: 'GET',
                url: 'http://localhost:8000/sections/?' + $scope.enrollments[i].section
            }).then(function successCallback(response) {
                $scope.classes = [];
                $scope.classes.push({
                    id: id,
                    title: response.data[0].title
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
            var x = $scope.classes;
            $scope.behaviors = response.data;
            $scope.classBehaviorScores = [];
            for (var i = 0; i < $scope.behaviors.length; i++) {
                //$scope.classBehaviorScores.push({
                //    // this id is also used to map to title in $scope.classes
                //    [response.data[i].enrollment.id]: {
                //        behavior: response.data[i].behavior,
                //        effort: response.data[i].effort
                //    }
                //})
                $scope.classBehaviorScores.push({
                    id: response.data[i].enrollment.id,
                    behaviorValue: response.data[i].behavior,
                    effortValue: response.data[i].effort
                });
            }
            

            // now I should be able to match each behavior and effort score to each class
        }, function errorCallback(response) {
            $scope.status = response.status;
        });
    }

    //// used to put or push behavior and effort scores
    //$scope.updateScores = function () {
    //    // believe I have to check if a score already exists
    //    // put is so, push otherwise
    //    $http({
    //        method: 'GET',
    //        url: 'http://localhost:8000/behaviors/?' + $scope.enrollments[i].section
    //    }).then(function successCallback(response) {
    //        $scope.behaviors.push(response.data);
    //    }, function errorCallback(response) {
    //        $scope.status = response.status;
    //    });
    //}

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

    $scope.records = [
    {
        "Name": "Math",
        "Behavior": "",
        "Effort": ""
    },
    {
        "Name": "Reading",
        "Behavior": "",
        "Effort": ""
    },
    {
        "Name": "Art",
        "Behavior": "",
        "Effort": ""
    },
    {
        "Name": "Science",
        "Behavior": "",
        "Effort": ""
    },
    {
        "Name": "History",
        "Behavior": "",
        "Effort": ""
    },
    {
        "Name": "English",
        "Behavior": "",
        "Effort": ""
    }
    ];

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