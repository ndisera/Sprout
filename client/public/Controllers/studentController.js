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
});