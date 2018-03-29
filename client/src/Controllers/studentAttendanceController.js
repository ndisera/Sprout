app.controller("studentAttendanceController", function ($scope, $routeParams, $location, toastService, attendanceService, data, terms, student) {
    $scope.location = $location;
    $scope.student = student.student;
});
