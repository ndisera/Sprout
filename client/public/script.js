var app = angular.module("app", ["ngRoute", "chart.js"]);

// configure our routes
app.config(function ($routeProvider) {
    $routeProvider

        // route for the admin(manage) page
        .when('/manage', {
            templateUrl: 'Views/manage.html',
            controller: 'manageController',
            resolve: {
                students: function (studentService) {
                    return studentService.getStudents();
                },
                teachers: function (teacherService) {
                    return teacherService.getTeachers();
                },
            }
        })

        // route for the settings page
        .when('/settings', {
            templateUrl: 'Views/settings.html',
            controller: 'settingsController',
        })

        // route for the focus students page
        .when('/focus', {
            templateUrl: 'Views/focusStudents.html',
            controller: 'focusStudentsController',
            resolve: {
                students: function(studentService) {
                    return studentService.getStudents();
                },
            }
        })

        // route for the input scores page
        .when('/scores', {
            templateUrl: 'Views/scoresInput.html',
            controller: 'scoresInputController'
        })

        // route for the student profile page
        .when('/student/:id', {
            templateUrl: 'Views/student.html',
            controller: 'studentController',
            resolve: {
                enrollments: function(enrollmentService, $route) {
                    return enrollmentService.getStudentEnrollments($route.current.params.id);
                },
                student: function(studentService, $route) {
                    return studentService.getStudent($route.current.params.id);
                },
            }
        });
});
