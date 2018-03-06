app.controller("studentIepsController", function($scope, $rootScope, $location, $routeParams, student, ieps) {
    $scope.location = $location;
    $scope.student = student.student;

    console.log(ieps);
});
