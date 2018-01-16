app.controller("manageController", function ($scope, $rootScope, $location, students) {
    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }

    $scope.students = students;
}