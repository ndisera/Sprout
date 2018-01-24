app.controller("scoresInputController", function ($scope, $location) {

    // redirect user if not logged in
    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }
});