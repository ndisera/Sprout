app.controller("settingsController", function ($scope, $location) {
    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }
});