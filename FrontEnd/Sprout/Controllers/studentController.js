﻿app.controller("studentController", function ($scope, $location) {
    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }

    $('#datepicker').datepicker({
        format: "dd/mm/yyyy"
    });
});