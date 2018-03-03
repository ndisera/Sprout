app.controller("studentServicesController", function($scope, $rootScope, $location, $routeParams, student) {
    $scope.location = $location;
    $scope.student = student.student;
});
