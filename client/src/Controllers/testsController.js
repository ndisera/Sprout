app.controller("testsController", function($scope, $rootScope, $location, toastService, testService, tests) {
    $scope.location = $location;

    $scope.takenBy = [];
    $scope.notTakenBy = [];
    $scope.tests = tests.standardized_tests;

    $scope.selectTest = function(test) {
        $scope.selectedTest = test;
    };

    $scope.downloadReport = function() {

    };
});
