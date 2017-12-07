app.controller("studentController", function ($scope, $location, $http, $rootScope) {

    $scope.classes = [];
    $scope.behaviors = [];

    // get student's classes
    $http({
        method: 'GET',
        url: 'http://localhost:8000/enrollments/?' + $rootScope.student.id
    }).then(function successCallback(response) {
        // enrollments will contain section id (for mapping to enrollments) and student id
        $scope.enrollments = response.data;
        for (var i = 0; i < $scope.enrollments.length; i++) {
            $http({
                method: 'GET',
                url: 'http://localhost:8000/sections/?' + $scope.enrollments[i].section
            }).then(function successCallback(response) {
                $scope.classes.push(response.data);
            }, function errorCallback(response) {
                $scope.status = response.status;
            });
        }
    }, function errorCallback(response) {
        $scope.status = response.status;
    });

    //// the classes array should now contain objects with teacher and title


    //// get behavior scores, is this where I filter by start date, end date, student id?
    //$scope.getBehaviors = function () {
    //    $http({
    //        method: 'GET',
    //        url: 'http://localhost:8000/behaviors/?' + $scope.enrollments[i].section
    //    }).then(function successCallback(response) {
    //        $scope.behaviors.push(response.data);
    //    }, function errorCallback(response) {
    //        $scope.status = response.status;
    //    });
    //}

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
        format: "mm/dd/yyyy"
    });

    function defaultDate() {
        var date = new Date();
        $scope.behaviorDate = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear();
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