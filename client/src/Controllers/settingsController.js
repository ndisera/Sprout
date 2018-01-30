app.controller("settingsController", function ($scope, $location) {

    // redirect user if not logged in
    if (!$rootScope.loggedIn) {
        location.path('');
    }
});
