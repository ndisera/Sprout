var app = angular.module(
    "app", 
    [
        "ngRoute", 
        "chart.js",
        "ngAnimate",
    ]
);

// configure our routes
app.config(function ($routeProvider, $httpProvider) {
    /**
     * Set our interceptor to add auth token to all requests
     */
    $httpProvider.interceptors.push('interceptorService');

    $routeProvider

        .when('/login', {
            templateUrl: 'html/login.html',
            controller: 'loginController',
        })

        // route for the admin(manage) page
        .when('/manage', {
            templateUrl: 'html/manage.html',
            controller: 'manageController',
            resolve: {
                students: function (studentService) {
                    return studentService.getStudents();
                },
                teachers: function (teacherService) {
                    return teacherService.getTeachers();
                },
                auth: function(userService) {
                    return userService.authVerify();
                },
            },
        })

        // route for the settings page
        .when('/settings', {
            templateUrl: 'html/settings.html',
            controller: 'settingsController',
            resolve: {
                auth: function(userService) {
                    return userService.authVerify();
                },
            },
        })

        // route for the focus students page
        .when('/focus', {
            templateUrl: 'html/focusStudents.html',
            controller: 'focusStudentsController',
            resolve: {
                students: function(studentService) {
                    return studentService.getStudents();
                },
                auth: function(userService) {
                    return userService.authVerify();
                },
            }
        })

        // route for the input scores page
        .when('/scores', {
            templateUrl: 'html/scoresInput.html',
            controller: 'scoresInputController',
            resolve: {
                auth: function(userService) {
                    return userService.authVerify();
                },
            },
        })

        // route for the student profile page
        .when('/student/:id', {
            templateUrl: 'html/student.html',
            controller: 'studentController',
            resolve: {
                enrollments: function(enrollmentService, $route) {
                    return enrollmentService.getStudentEnrollments(
                        { 
                            include: ['section.*'],
                            filter: [{ name: 'student', val: $route.current.params.id },],
                        }
                    );
                },
                student: function(studentService, $route) {
                    return studentService.getStudent($route.current.params.id);
                },
                auth: function(userService) {
                    return userService.authVerify();
                },
            }
        })

        .otherwise({ redirectTo: '/focus' });
})

.run(function($rootScope, $location, userService) {
    
    /**
     *  Used to determine where to make calls to the backend
     */
    $rootScope.backendHostname = $location.host();

    /**
     *  Used to determine how to make calls to the backend
     */
    $rootScope.backendPort = 8000;

    /**
     *  Convenience variable - Combine backendHostname and backendPort in a manner which
     *  they will often be used
     */
    $rootScope.backend = $rootScope.backendHostname + ':' + $rootScope.backendPort

    /**
     * Define where the auth token will be in local storage
     */
    $rootScope.tokenKey = 'JSONWebToken';

    /**
     * Set listener for route change errors (user is not auth-ed)
     */
    $rootScope.$on('$routeChangeError', function(event, next, current) {
        // log out the user
        userService.logout();

        // redirect the user
        $location.path('/login').replace();

        //TODO(gzuber): notify user
    });

    /**
     * Load the user's previous authentication token
     */
    userService.loadToken();

});






