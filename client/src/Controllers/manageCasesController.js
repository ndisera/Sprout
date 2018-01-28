app.controller("manageCasesController", function ($scope, $rootScope, $location, students, teachers, studentService, teacherService) {
    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }
})