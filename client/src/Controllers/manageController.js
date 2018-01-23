app.controller("manageController", function ($scope, $rootScope, $location, students, teachers) {

    // redirect user if not logged in
    if (!$rootScope.loggedIn) {
        location.path('');
    }
    
    $scope.task = "";
    $scope.displayStudentSearch = true;
    $scope.displayStudentForm = false;
    $scope.displayTeacherSearch = true;
    $scope.displayTeacherForm = false;
    $scope.students = students;
    $scope.teachers = teachers;
    $scope.studentsLookup = {};
    $scope.teachersLookup = {};

    // create fast lookup student dictionary
    for (var i = 0; i < $scope.students.length; ++i) {
        var lookupName = $scope.students[i].first_name + " " + $scope.students[i].last_name;
        $scope.studentsLookup[lookupName.toUpperCase()] = $scope.students[i];
    }
    $scope.teachers = teachers;
    // create fast lookup teacher dictionary
    for (var i = 0; i < $scope.teachers.length; ++i) {
        var lookupName = $scope.teachers[i].first_name + " " + $scope.teachers[i].last_name;
        $scope.teachersLookup[lookupName.toUpperCase()] = $scope.teachers[i];
    }

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
    };

    $scope.changeStudentTask = function (task) {
        $scope.task = task;
        if (task == 'view/edit' || task == 'delete') {
            $scope.displayStudentSearch = true;
            $scope.displayStudentForm = false;
        } else if (task == 'add') {
            $scope.displayStudentSearch = false;
            $scope.displayStudentForm = true;
        }
        // remove or set active property
        setActiveButton('s', task);
    };

    $scope.changeTeacherTask = function (task) {
        $scope.task = task;
        if (task == 'view/edit' || task == 'delete') {
            $scope.displayTeacherSearch = true;
            $scope.displayTeacherForm = false;
        } else if (task == 'add') {
            $scope.displayTeacherSearch = false;
            $scope.displayTeacherForm = true;
        }
        // remove or set active property
        setActiveButton('t', task);
    };

    function setActiveButton(st, task) {
        task == 'view/edit' ? document.getElementById(st + 'ViewButton').classList.add('active') : document.getElementById(st + 'ViewButton').classList.remove('active');
        task == 'add' ? document.getElementById(st + 'AddButton').classList.add('active') : document.getElementById(st + 'AddButton').classList.remove('active');
        task == 'delete' ? document.getElementById(st + 'DeleteButton').classList.add('active') : document.getElementById(st + 'DeleteButton').classList.remove('active');
    }

    /**
     * Navigates to student's page if name in navigation search bar is valid.
     */
    $scope.viewStudent = function () {
        if ($scope.studentSearch.toUpperCase() in $scope.studentsLookup) {
            $location.path('/student/' + $scope.studentsLookup[$scope.studentSearch.toUpperCase()].id);
            return;
        }
        else {
            //TODO: notify the user in some way
        }
    };

    /**
     * Displays teacher info if name in teacher search bar is valid.
     */
    $scope.viewTeacher = function () {
        if ($scope.teacherSearch.toUpperCase() in $scope.teachersLookup) {
            // display basic info that is also editable
            return;
        }
        else {
            //TODO: notify the user in some way
        }
    };

    /**
     * Clears the manage student search bar.
     */
    $scope.clearStudentSearch = function () {
        $scope.studentSearch = "";
    };

    /**
     * Clears the manage teacher search bar.
     */
    $scope.clearTeacherSearch = function () {
        $scope.teacherSearch = "";
    };
});