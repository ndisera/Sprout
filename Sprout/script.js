var app = angular.module("app", ["ngRoute"]);

// configure our routes
app.config(function ($routeProvider) {
    $routeProvider

        .when('/', {
            templateUrl: 'Views/home.html',
            controller: 'homeController'
        })

        // route for the login page
        .when('/login', {
            templateUrl: 'Views/login.html',
            controller: 'loginController'
        })

        // route for the contact page
        .when('/student', {
            templateUrl: 'Views/student.html',
            controller: 'studentController'
        });
});