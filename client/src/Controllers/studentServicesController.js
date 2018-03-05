app.controller("studentServicesController", function($scope, $rootScope, $location, $routeParams, student, services) {
    $scope.location = $location;
    $scope.student = student.student;
    $scope.services = services.service_requirements;

    console.log(services);
});
