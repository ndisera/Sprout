var app = angular.module("app", ["ngRoute"]);

// configure our routes
app.config(function ($routeProvider) {
    $routeProvider

        // route for the settings page
        .when('/settings', {
            templateUrl: 'Views/settings.html',
            controller: 'settingsController'
        })

        // route for the focus students page
        .when('/focus', {
            templateUrl: 'Views/focusStudents.html',
            controller: 'focusStudentsController'
        })

        // route for the input scores page
        .when('/scores', {
            templateUrl: 'Views/scoresInput.html',
            controller: 'scoresInputController'
        })

        // route for the student profile page
        .when('/student/:id', {
            templateUrl: 'Views/student.html',
            controller: 'studentController'
        });
});
