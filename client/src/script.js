var app = angular.module(
    'app', [
        'ngRoute',
        'chart.js',
        'ngAnimate',
        'ngImgCrop',
        'datePicker',
        'ui.sortable',
        'ngFileUpload',
        'ui.calendar',
    ]
);

// configure our routes
app.config(function($httpProvider, $locationProvider, $routeProvider) {
        /**
         * Set our interceptor to add auth token to all requests
         */
        $httpProvider.interceptors.push('interceptorService');

        $locationProvider.html5Mode(true);

        $routeProvider

            // login and password related routes
            .when('/login', {
                templateUrl: 'html/login.html',
                controller: 'loginController',
            })

            .when('/password/reset', {
                templateUrl: 'html/passwordReset.html',
                controller: 'passwordResetController',
            })

            .when('/password/reset/confirm/:id/:token', {
                templateUrl: 'html/passwordResetConfirm.html',
                controller: 'passwordResetConfirmController',
            })

            .when('/reports', {
                redirectTo: '/reports/tests',
            })

            // route tests query page
            .when('/reports/tests', {
                templateUrl: 'html/tests.html',
                controller: 'testsController',
                resolve: {
                    auth: function(userService) {
                        return userService.authVerify();
                    },
                    tests: function(testService) {
                        return testService.getTests();
                    },
                    students: function(studentService) {
                        return studentService.getStudents();
                    },
                },
            })

            // route for the service page
            .when('/reports/services', {
                templateUrl: 'html/services.html',
                controller: 'servicesController',
                resolve: {
                    auth: function(userService) {
                        return userService.authVerify();
                    },
                },
            })

            // mass entry related routes
            .when('/input', {
                redirectTo: '/input/behavior',
            })

            .when('/input/behavior', {
                templateUrl: 'html/inputBehavior.html',
                controller: 'inputBehaviorController',
                resolve: {
                    studentData: function($q, $rootScope, userService, serviceService) {
                        var deferred = $q.defer();
                        userService.authVerify().then(
                            function success() {
                                var config = {
                                    filter: [{
                                        name: 'type',
                                        val: $rootScope.serviceNameToType['Behavior'],
                                    }, ],
                                    include: ['student.*'],
                                };

                                // only get students I case manage if I'm not an admin
                                if (!userService.user.isSuperUser) {
                                    config.filter.push({
                                        name: 'student.case_manager',
                                        val: userService.user.id,
                                    });
                                }

                                serviceService.getServices(config).then(
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
                    terms: function(termService) {
                        return termService.getTerms();
                    },
                    auth: function(userService) {
                        return userService.authVerify();
                    },
                },
            })

            .when('/input/tests', {
                templateUrl: 'html/inputTests.html',
                controller: 'inputTestsController',
                resolve: {
                    students: function(studentService) {
                        return studentService.getStudents();
                    },
                    enrollmentData: function($q, userService, enrollmentService) {
                        //TODO(gzuber): I don't like this in script.js...
                        var deferred = $q.defer();
                        userService.authVerify().then(
                            function success() {
                                var config = {
                                    filter: [{
                                        name: 'section.teacher',
                                        val: userService.user.id,
                                    }, ],
                                    include: ['section.*', ],
                                };
                                enrollmentService.getStudentEnrollments(config).then(
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
                    tests: function(testService) {
                        return testService.getTests();
                    },
                    terms: function(termService) {
                        return termService.getTerms();
                    },
                    auth: function(userService) {
                        return userService.authVerify();
                    },
                },
            })

            .when('/manage', {
                redirectTo: '/manage/cases',
            })

            // route for the manage students page
            .when('/manage/students', {
                templateUrl: 'html/manageStudents.html',
                controller: 'manageStudentsController',
                resolve: {
                    auth: function(userService) {
                        return userService.authVerify(true);
                    },
                    students: function(studentService) {
                        return studentService.getStudents();
                    },
                    schools: function(schoolService) {
                        return schoolService.getSchools();
                    },
                }
            })

            // route for the manage teachers page
            .when('/manage/teachers', {
                templateUrl: 'html/manageTeachers.html',
                controller: 'manageTeachersController',
                resolve: {
                    auth: function(userService) {
                        return userService.authVerify(true);
                    },
                    userData: function(userService) {
                        return userService.getUsers();
                    },
                    termData: function(termService) {
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
                    auth: function(userService) {
                        return userService.authVerify(true);
                    },
                    students: function(studentService) {
                        return studentService.getStudents();
                    },
                    userData: function(userService) {
                        return userService.getUsers();
                    },
                }
            })

            // route for the manage classes page
            .when('/manage/classes', {
                templateUrl: 'html/manageClasses.html',
                controller: 'manageClassesController',
                resolve: {
                    auth: function(userService) {
                        return userService.authVerify(true);
                    },
                    students: function(studentService) {
                        return studentService.getStudents();
                    },
                    userData: function(userService) {
                        return userService.getUsers();
                    },
                    sections: function(sectionService) {
                        return sectionService.getSections();
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
                        return userService.authVerify(true);
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
                    focusData: function($q, userService) {
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
                    enrollmentData: function($q, userService, enrollmentService) {
                        //TODO(gzuber): I don't like this in script.js...
                        var deferred = $q.defer();
                        userService.authVerify().then(
                            function success() {
                                var config = {
                                    include: ['section.*', ],
                                };
                                enrollmentService.getStudentEnrollments(config).then(
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
                    terms: function(termService) {
                        return termService.getTerms();
                    },
                }
            })

            .when('/profile/students', {
                templateUrl: 'html/profileStudents.html',
                controller: 'profileStudentsController',
                controllerAs: 'control',
                resolve: {
                    students: function(studentService) {
                        return studentService.getStudents();
                    },
                    terms: function(termService) {
                        return termService.getTerms();
                    },
                    data: function($q, userService, enrollmentService, studentService) {
                        //TODO(gzuber): I don't like this in script.js...
                        var deferred = $q.defer();
                        userService.authVerify().then(
                            function success() {
                                var deferreds = [];

                                var enrollmentConfig = {
                                    filter: [{
                                        name: 'section.teacher.pk',
                                        val: userService.user.id,
                                    }, ],
                                    include: ['student.*', 'section.*', ],
                                };
                                deferreds.push(enrollmentService.getStudentEnrollments(enrollmentConfig));

                                var studentConfig = {
                                    filter: [{
                                        name: 'case_manager',
                                        val: userService.user.id,
                                    }, ],
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
                            }
                        );
                        return deferred.promise;
                    },
                }
            })

            // routes for the student profile pages
            .when('/student/:id', {
                templateUrl: 'html/studentOverview.html',
                controller: 'studentOverviewController',
                resolve: {
                    enrollmentData: function(enrollmentService, $route) {
                        return enrollmentService.getStudentEnrollments({
                            include: ['section.*', ],
                            filter: [{
                                name: 'student',
                                val: $route.current.params.id
                            }, ],
                        });
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
                    parentContactData: function(studentService, $route) {
                        return studentService.getParentContactInfoForStudent($route.current.params.id);
                    },
                    school: function(schoolService) {
                        return schoolService.getSchools();
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
                    testData: function(testService, $route) {
                        return testService.getTests();
                    },
                    termData: function(termService) {
                        var config = {
                            include: ['settings.*', 'settings.schedule.*', ],
                        };
                        return termService.getTerms(config);
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
                        return enrollmentService.getStudentEnrollments({
                            include: ['section.*', ],
                            filter: [{
                                name: 'student',
                                val: $route.current.params.id,
                            }, ],
                        });
                    },
                    terms: function(termService) {
                        return termService.getTerms();
                    },
                    student: function(studentService, $route) {
                        return studentService.getStudent($route.current.params.id);
                    },
                    service: function(studentService, $rootScope, $route) {
                        return studentService.getServicesForStudent($route.current.params.id, {
                            filter: [{
                                name: 'type',
                                val: $rootScope.serviceNameToType['Behavior'],
                            }],
                        });
                    },
                    auth: function(userService) {
                        return userService.authVerify();
                    },
                }
            })

            .when('/student/:id/attendance', {
                templateUrl: 'html/studentAttendance.html',
                controller: 'studentAttendanceController',
                resolve: {
                    data: function(attendanceService, $route) {
                        return attendanceService.getStudentAttendance({
                            include: ['enrollment.*', 'enrollment.section.*'],
                            filter: [{
                                name: 'enrollment.student',
                                val: $route.current.params.id
                            }]
                        });
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
                        return enrollmentService.getStudentEnrollments({
                            include: ['section.*', 'section.teacher.*'],
                            filter: [{
                                name: 'student',
                                val: $route.current.params.id
                            }, ],
                        });
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
                },
            })

            .when('/feedback', {
                templateUrl: 'html/feedback.html',
                controller: 'feedbackController',
                resolve: {
                    auth: function(userService) {
                        return userService.authVerify();
                    },
                },
            })

            .otherwise({
                redirectTo: '/profile/focus'
            });
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
        $rootScope.$on('$routeChangeError', function(event, next, current, rejection) {
            // log out the user
            userService.logout();

            // redirect the user
            $location.path('/login').replace();

            // notify user
            if (rejection !== null && rejection !== undefined && rejection.data !== null && rejection.data !== undefined) {
                if (rejection.data.message !== null && rejection.data.message !== undefined) {
                    // tried to access admin priviledged page
                    if (rejection.status === 200 && rejection.data.message === 'Token valid') {
                        toastService.error('You are not authorized to view that page.');
                        return;
                    }
                }
                if (rejection.data.detail !== null && rejection.data.detail !== undefined) {
                    // went to sprout for the first time
                    if (rejection.data.detail === "Authentication credentials were not provided.") {
                        return;
                    }
                    // token expired
                    if (rejection.data.detail === "Signature has expired.") {
                        toastService.info('Your session has timed out. Please log in again.');
                        return;
                    }
                }
            }
            // catch-all
            toastService.error('There was an error with the server. Please log back in.');
        });

        /**
         * Load the user's previous authentication token
         */
        userService.loadToken();
        if (userService.user.token !== null && userService.user.token !== undefined) {
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
            tinycolor('#8860d0'), // purple
            tinycolor('#0b3c5d'), // prussian blue
            tinycolor('#963484'), // purple red
            tinycolor('#d9b310'), // gold leaf
            tinycolor('#ff3b3f'), // watermelon
            tinycolor('#333333'), // grey
        ];

        $rootScope.calendarColors = [
            tinycolor('#ffc67c'), // orange
            tinycolor('#5ab9ea'), // light blue
            tinycolor('#ff6d70'), // light red
            tinycolor('#a877ff'), // light purple
            tinycolor('#ff84e8'), // purple red
            tinycolor('#ede971'), // goldish
            tinycolor('#57bc90'), // green
            tinycolor('#337ab7'), // blue
        ];

        // set chartjs default colors
        Chart.defaults.global.colors = _.map($rootScope.colors, function(elem) {
            return elem.toHexString();
        });

        /*** GLOBAL ENUM RELATED SETUP ***/
        $rootScope.serviceTypeToName = {
            '0': 'Behavior',
            '1': 'Psych',
            '2': 'Speech Therapy',
            '3': 'Occupational Therapy',
            '4': 'Physical Therapy',
            '5': 'Adaptive PE',
            '6': 'Transportation',
            '7': 'ESY',
            '8': 'Personal Health Care',
            '9': 'Audiological',
            '10': 'Vision',
            '11': 'Math',
            '12': 'Reading',
            '13': 'Writing',
            '14': 'Academic Support',
            '15': 'Transition',
        };

        $rootScope.serviceNameToType = {
            'Behavior': '0',
            'Psych': '1',
            'Speech Therapy': '2',
            'Occupational Therapy': '3',
            'Physical Therapy': '4',
            'Adaptive PE': '5',
            'Transportation': '6',
            'ESY': '7',
            'Personal Health Care': '8',
            'Audiological': '9',
            'Vision': '10',
            'Math': '11',
            'Reading': '12',
            'Writing': '13',
            'Academic Support': '14',
            'Transition': '15',
        };

        $rootScope.logoImgData = 'data:image/jpeg;base64,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';

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

        // Close modals on location change (found this beaut on stackoverflow)
        $rootScope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
            // Select open modal(s)
            var $openModalSelector = $(".modal.fade.in");
            if (($openModalSelector.data('bs.modal') || {}).isShown == true) {
                // Close open modal(s)
                $openModalSelector.modal("hide");
                // Prevent page transition
                event.preventDefault();
            }
        });

        /**
         * set up a listener on route change to go get the currently-being-viewed
         * student's picture, but only if that's not the picture I already have
         * stored in $root
         */
        $rootScope.$on('$routeChangeStart', function(event, next, current) {
            // being very careful cause this will run on every page
            if (next === null || next === undefined ||
                next.$$route === null || next.$$route === undefined ||
                next.$$route.originalPath === null || next.$$route.originalPath === undefined) {
                return;
            }

            // going to a student page
            if (next.$$route.originalPath.split('/')[1] === 'student') {

                if (next.params === null || next.params === undefined ||
                    next.params.id === null || next.params.id === undefined) {
                    return;
                }

                if ($rootScope.currentStudent.id !== next.params.id || $rootScope.currentStudent.picture === null) {
                    studentService.getStudentPicture(next.params.id).then(
                        function success(picture) {
                            $rootScope.currentStudent.id = next.params.id;
                            $rootScope.currentStudent.picture = picture;
                        }
                    );
                }
            }
        });
    });
