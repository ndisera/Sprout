var app = angular.module("app", ["ngRoute", "chart.js"]);

// configure our routes
app.config(function ($routeProvider) {
    $routeProvider

        // route for the manage students page
        .when('/managestudents', {
            templateUrl: 'html/manageStudents.html',
            controller: 'manageStudentsController',
            resolve: {
                students: function (studentService) {
                    return studentService.getStudents();
                }
            }
        })

        // route for the manage teachers page
        .when('/manageteachers', {
            templateUrl: 'html/manageTeachers.html',
            controller: 'manageTeachersController',
            resolve: {
                teachers: function (teacherService) {
                    return teacherService.getTeachers();
                }
            }
        })

        // route for the manage (cases) page
        .when('/managecases', {
            templateUrl: 'html/manageCases.html',
            controller: 'manageCasesController',
            resolve: {
                students: function (studentService) {
                    return studentService.getStudents();
                },
                teachers: function (teacherService) {
                    return teacherService.getTeachers();
                },
            }
        })

        // route for the manage classes page
        .when('/manageclasses', {
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
                }
            }
        })

        // route for the settings page
        .when('/settings', {
            templateUrl: 'html/settings.html',
            controller: 'settingsController',
        })

        // route for the focus students page
        .when('/focus', {
            templateUrl: 'html/focusStudents.html',
            controller: 'focusStudentsController',
            resolve: {
                students: function (studentService) {
                    return studentService.getStudents();
                },
            }
        })

        // route for the input scores page
        .when('/scores', {
            templateUrl: 'html/scoresInput.html',
            controller: 'scoresInputController'
        })

        // route for the student profile page
        .when('/student/:id', {
            templateUrl: 'html/student.html',
            controller: 'studentController',
            resolve: {
                enrollments: function (enrollmentService, $route) {
                    return enrollmentService.getStudentEnrollments(
                        {
                            include: ['section.*'],
                            filter: [{ name: 'student', val: $route.current.params.id }, ],
                        }
                    );
                },
                student: function (studentService, $route) {
                    return studentService.getStudent($route.current.params.id);
                },
            }
        });
})

.run(function ($rootScope, $location) {

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

});






