app.controller("manageController", function ($scope, $rootScope, $location, students) {
    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }

    $scope.students = students;

    $scope.setActivePillAndTab = function (name) {
        switch (name) {
            case "casemanagers":
                $('.nav-tabs a[data-target="#overview"]').tab('casemanagers');
                $('.nav-pills a[data-target="#overview"]').tab('casemanagers');
                break;
            case "teachers":
                $('.nav-tabs a[data-target="#tests"]').tab('teachers');
                $('.nav-pills a[data-target="#tests"]').tab('teachers');
                break;
            case "students":
                $('.nav-tabs a[data-target="#behavior"]').tab('students');
                $('.nav-pills a[data-target="#behavior"]').tab('students');
                break;
            default:
        }
    }
});