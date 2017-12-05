app.controller("studentController", function ($scope, $location) {
    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }

    $('#datepicker').datepicker({
        format: "mm/dd/yyyy"
    });

    function defaultDate() {
        date = new Date();
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