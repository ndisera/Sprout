var app = angular.module(
    'app',
    [
        'ngRoute',
        'chart.js',
        'ngAnimate',
        'ngImgCrop',
        'datePicker',
        'ui.sortable',
        'ngFileUpload',
    ]
);

// configure our routes
app.config(function ($httpProvider, $locationProvider, $routeProvider) {
    /**
     * Set our interceptor to add auth token to all requests
     */
    $httpProvider.interceptors.push('interceptorService');

    $locationProvider.html5Mode(true);

    $routeProvider

        .when('/login', {
            templateUrl: 'html/login.html',
            controller: 'loginController',
        })

        .when('/manage', {
            redirectTo: '/manage/classes',
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
                userData: function(userService) {
                    return userService.getUsers();
                },
                auth: function (userService) {
                    return userService.authVerify();
                },
                termsInfo: function(termService) {
                    return termService.getTerms({
                        include: ['settings.schedule.*']
                    });
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
                userData: function(userService) {
                    return userService.getUsers();
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
                userData: function(userService) {
                    return userService.getUsers();
                },
                sections: function (sectionService) {
                    return sectionService.getSections();
                },
                auth: function(userService) {
                    return userService.authVerify();
                },
                termsInfo: function(termService) {
                    return termService.getTerms({
                        include: ['settings.schedule.*']
                    });
                },
            },
        })

        // route for the settings page
        .when('/settings', {
            redirectTo: '/settings/user',
        })

        // route for the user settings page
        .when('/settings/user', {
            templateUrl: 'html/userSettings.html',
            controller: 'userSettingsController',
            resolve: {
                auth: function(userService) {
                    return userService.authVerify();
                },
            },
        })

        // route for the school settings page
        .when('/settings/school', {
            templateUrl: 'html/schoolSettings.html',
            controller: 'schoolSettingsController',
            resolve: {
                auth: function(userService) {
                    return userService.authVerify();
                },
                holidays: function(holidayService) {
                    return holidayService.getHolidays();
                },
                terms: function(termService) {
                    return termService.getTerms();
                },
                tests: function(testService) {
                    return testService.getTests();
                },
                schools: function(schoolService) {
                    return schoolService.getSchools();
                },
                schedules: function(scheduleService) {
                    return scheduleService.getSchedules();
                },
                termSettings: function(termService) {
                    return termService.getTermSettings();
                },
                schoolYears: function(schoolYearService) {
                    return schoolYearService.getSchoolYears();
                },
            },
        })

        // route for the profile page
        .when('/profile', {
            redirectTo: '/profile/focus',
        })

        // route for the focus students page
        .when('/profile/focus', {
            templateUrl: 'html/profileFocus.html',
            controller: 'profileFocusController',
            resolve: {
                studentData: function(studentService) {
                    return studentService.getStudents();
                },
                // need to make sure user in userService is set before calling
                focusData: function ($q, userService) {
                    //TODO(gzuber): I don't like this in script.js...
                    var deferred = $q.defer();
                    userService.authVerify().then(
                        function success() {
                            userService.getAllFocusForUser(userService.user.id).then(
                                function success(data) {
                                    deferred.resolve(data);
                                },
                                function error(response) {
                                    deferred.reject(response);
                                }
                            );
                        },
                        function error(response) {
                            deferred.reject(response);
                        }
                    );
                    return deferred.promise;
                },
                testData: function(testService) {
                    return testService.getTests();
                },
            }
        })

        .when('/profile/students', {
            templateUrl: 'html/profileStudents.html',
            controller: 'profileStudentsController',
            controllerAs: 'control',
            resolve: {
                data: function ($q, userService, enrollmentService, studentService) {
                    //TODO(gzuber): I don't like this in script.js...
                    var deferred = $q.defer();
                    userService.authVerify().then(
                        function success() {
                            var deferreds = [];

                            var enrollmentConfig = {
                                filter: [ { name: 'section.teacher.pk', val: userService.user.id, }, ],
                                include: ['student.*', 'section.*', ],
                            };
                            deferreds.push(enrollmentService.getStudentEnrollments(enrollmentConfig));

                            var studentConfig = {
                                filter: [ { name: 'case_manager', val: userService.user.id, }, ],
                            };
                            deferreds.push(studentService.getStudents(studentConfig));

                            $q.all(deferreds)
                                .then(function(data) {
                                    deferred.resolve(data);
                                })
                                .catch(function(data) {
                                    deferred.reject(data);
                                });
                        },
                        function error(response) {
                            deferred.reject(response);
                        },
                    );
                    return deferred.promise;
                },
            }
        })

        // route for the input scores page
        .when('/input', {
            templateUrl: 'html/scoresInput.html',
            controller: 'scoresInputController',
            resolve: {
                auth: function(userService) {
                    return userService.authVerify();
                },
            },
        })

        // route for the input scores page
        .when('/notifications', {
            templateUrl: 'html/notifications.html',
            controller: 'notificationsController',
            resolve: {
                // need to make sure user in userService is set before calling
                data: function ($q, userService) {
                    //TODO(gzuber): I don't like this in script.js...
                    var deferred = $q.defer();
                    userService.authVerify().then(
                        function success() {
                            userService.getAllNotificationsForUser(userService.user.id).then(
                                function success(data) {
                                    deferred.resolve(data);
                                },
                                function error(response) {
                                    deferred.reject(response);
                                },
                            );
                        },
                        function error(response) {
                            deferred.reject(response);
                        },
                    );
                    return deferred.promise;
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
                            include: ['section.*', ],
                            filter: [{ name: 'student', val: $route.current.params.id },],
                        }
                    );
                },
                termData: function(termService) {
                    var config = {
                        include: ['settings.*', 'settings.schedule.*', ],
                    };
                    return termService.getTerms(config);
                },
                userData: function(userService) {
                    return userService.getUsers();
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
                studentData: function(studentService, $route) {
                    return studentService.getStudent($route.current.params.id);
                },

                // I'm thinking this will be gotten from inside of the tests controller, not here
                // testData: function(testService, $route) {
                //     return testService.getTests(); //we want them all...
                // },

                // data: function(enrollmentService, $route) {
                //     return enrollmentService.getStudentEnrollments(
                //       {
                //           include: ['section.*', 'student.*'],
                //           filter: [{ name: 'student', val: $route.current.params.id, },],
                //       }
                //     );
                // },
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
                            include: ['section.*', ],
                            filter: [{ name: 'student', val: $route.current.params.id, },],
                        }
                    );
                },
                terms: function(termService) {
                    return termService.getTerms();
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
                ieps: function(studentService, $route) {
                    return studentService.getIepsForStudent($route.current.params.id);
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
                services: function(studentService, $route) {
                    var config = {
                        include: ['fulfilled_user.*', ],
                    };
                    return studentService.getServicesForStudent($route.current.params.id, config);
                },
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
                termData: function(termService) {
                    return termService.getTerms();
                },
                studentData: function(studentService, $route) {
                    return studentService.getStudent($route.current.params.id);
                },
                auth: function(userService) {
                    return userService.authVerify();
                },
            }
        })

        .otherwise({ redirectTo: '/profile/focus' });
})

.run(function($rootScope, $location, toastService, userService, studentService) {

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
        console.log(userService.user);
        // log out the user
        userService.logout();

        // redirect the user
        $location.path('/login').replace();

        // notify user
        toastService.error('There was a fatal error with the server. Please log back in.');
    });

    /**
     * Load the user's previous authentication token
     */
    userService.loadToken();
    if(userService.user.token !== null && userService.user.token !== undefined) {
        userService.authVerify();
    }

    // set global toastr options
    toastr.options = {
        closeButton: true,
    };

    // define colors to be used globally
    $rootScope.colors = [
        tinycolor('#57bc90'), // green
        tinycolor('#5ab9ea'), // light blue
        tinycolor('#0b3c5d'), // prussian blue
        tinycolor('#8860d0'), // purple
        tinycolor('#963484'), // purple red
        tinycolor('#d9b310'), // gold leaf
        tinycolor('#ff3b3f'), // watermelon
        tinycolor('#333333'), // grey
    ];

    // set chartjs default colors
    Chart.defaults.global.colors = _.map($rootScope.colors, function(elem) { return elem.toHexString(); });


    /*** STUDENT PICTURE RELATED SETUP ***/

    /**
     * set global currently-being-viewed student to initial value.
     * this is part of a system that prevents a student's picture
     * from being downloaded constantly.
     */
    $rootScope.currentStudent = {
        id: -1,
        picture: null,
    };

    /**
     * set up a listener on route change to go get the currently-being-viewed
     * student's picture, but only if that's not the picture I already have
     * stored in $root
     */
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        // being very careful cause this will run on every page
        if(next === null || next === undefined
            || next.$$route === null || next.$$route === undefined
            || next.$$route.originalPath === null || next.$$route.originalPath === undefined) {
            return;
        }

        // going to a student page
        if(next.$$route.originalPath.split('/')[1] === 'student') {

            if(next.params === null || next.params === undefined
                || next.params.id === null || next.params.id === undefined) {
                return;
            }

            if($rootScope.currentStudent.id !== next.params.id || $rootScope.currentStudent.picture === null) {
                studentService.getStudentPicture(next.params.id).then(
                    function success(picture) {
                        $rootScope.currentStudent.id = next.params.id;
                        $rootScope.currentStudent.picture = picture;
                    },
                );
            }
        }
    });
});










