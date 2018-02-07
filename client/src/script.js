var app = angular.module(
    "app", 
    [
        "ngRoute", 
        "chart.js",
        "ngAnimate",
        "datePicker",
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

        .when('/manage', {
            redirectTo: '/manage/cases',
        })

        // route for the manage students page
        .when('/manage/students', {
            templateUrl: 'html/manageStudents.html',
            controller: 'manageStudentsController',
            resolve: {
                students: function (studentService) {
                    return studentService.getStudents();
                },
                auth: function (userService) {
                    return userService.authVerify();
                },
            }
        })

        // route for the manage teachers page
        .when('/manage/teachers', {
            templateUrl: 'html/manageTeachers.html',
            controller: 'manageTeachersController',
            resolve: {
                teachers: function (teacherService) {
                    return teacherService.getTeachers();
                },
                auth: function (userService) {
                    return userService.authVerify();
                },
            }
        })

        // route for the manage (cases) page
        .when('/manage/cases', {
            templateUrl: 'html/manageCases.html',
            controller: 'manageCasesController',
            resolve: {
                students: function (studentService) {
                    return studentService.getStudents();
                },
                teachers: function (teacherService) {
                    return teacherService.getTeachers();
                },
                auth: function (userService) {
                    return userService.authVerify();
                },
            }
        })

        // route for the manage classes page
        .when('/manage/classes', {
            templateUrl: 'html/manageClasses.html',
            controller: 'manageClassesController',
            resolve: {
                students: function (studentService) {
                    return studentService.getStudents();
                },
                teachers: function (teacherService) {
                    return teacherService.getTeachers();
                },
                sections: function (sectionService) {
                    return sectionService.getSections();
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
                students: function (studentService) {
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

        // routes for the student profile pages
        .when('/student/:id', {
            templateUrl: 'html/studentOverview.html',
            controller: 'studentOverviewController',
            resolve: {
                enrollmentData: function(enrollmentService, $route) {
                    return enrollmentService.getStudentEnrollments(
                        { 
                            include: ['section.*', 'section.teacher.*'],
                            filter: [{ name: 'student', val: $route.current.params.id },],
                        }
                    );
                },
                caseManagerData: function(caseManagerService, $route) {
                    return caseManagerService.getCaseManager(
                        {
                            filter: [{ name: 'student', val: $route.current.params.id },],
                        }
                    );
                },
                teacherData: function(teacherService, $route) {
                    return teacherService.getTeachers();
                },
                studentData: function(studentService, $route) {
                    return studentService.getStudent($route.current.params.id);
                },
                auth: function(userService) {
                    return userService.authVerify();
                },
            }
        })

        .when('/student/:id/tests', {
            templateUrl: 'html/studentTests.html',
            controller: 'studentTestsController',
            resolve: {
                data: function(enrollmentService, $route) {
                    return enrollmentService.getStudentEnrollments(
                      {
                          include: ['section.*', 'student.*'],
                          filter: [{ name: 'student', val: $route.current.params.id, },],
                      }
                    );
                },
                auth: function(userService) {
                    return userService.authVerify();
                },
            }
        })

        .when('/student/:id/behaviors', {
            templateUrl: 'html/studentBehaviors.html',
            controller: 'studentBehaviorsController',
            resolve: {
                data: function(enrollmentService, $route) {
                    return enrollmentService.getStudentEnrollments(
                        {
                            include: ['section.*',],
                            filter: [{ name: 'student', val: $route.current.params.id, },],
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

        .when('/student/:id/ieps', {
            templateUrl: 'html/studentIeps.html',
            controller: 'studentIepsController',
            resolve: {
                student: function(studentService, $route) {
                    return studentService.getStudent($route.current.params.id);
                },
                auth: function(userService) {
                    return userService.authVerify();
                },
            }
        })

        .when('/student/:id/services', {
            templateUrl: 'html/studentServices.html',
            controller: 'studentServicesController',
            resolve: {
                student: function(studentService, $route) {
                    return studentService.getStudent($route.current.params.id);
                },
                auth: function(userService) {
                    return userService.authVerify();
                },
            }
        })

        .when('/student/:id/grades', {
            templateUrl: 'html/studentGrades.html',
            controller: 'studentGradesController',
            resolve: {
                enrollmentData: function(enrollmentService, $route) {
                    return enrollmentService.getStudentEnrollments(
                        { 
                            include: ['section.*', 'section.teacher.*'],
                            filter: [{ name: 'student', val: $route.current.params.id },],
                        }
                    );
                },
                studentData: function(studentService, $route) {
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
    $rootScope.backend = $rootScope.backendHostname + ':' + $rootScope.backendPort;

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






