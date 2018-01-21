app.controller("manageController", function ($scope, $rootScope, $location, students, teachers, studentService, teacherService) {
    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }

    // remember to get students again after adding/editing/deleting
    // or just make change to what we already have

    var teacherTask = "view/edit";
    var studentTask = "view/edit";
    $scope.displayStudentViewSearch = true;
    $scope.displayStudentDeleteSearch = false;
    $scope.displayStudentForm = false;
    $scope.displayTeacherViewSearch = true;
    $scope.displayTeacherDeleteSearch = false;
    $scope.displayTeacherForm = false;
    var teacherVSearchOrInfo = "search";
    var teacherDSearchOrInfo = "search";
    var studentDSearchOrInfo = "search";
    $scope.students = students;
    $scope.teachers = teachers;
    $scope.studentsLookup = {};
    $scope.teachersLookup = {};
    $scope.studentV = {};
    $scope.teacherV = {};
    $scope.studentD = {};
    $scope.teacherD = {};
    $scope.newTeacher = {};
    $scope.newStudent = {};
    $scope.addStudentSuccess = false;
    $scope.addTeacherSuccess = false;
    $scope.deleteStudentSuccess = false;
    $scope.deleteTeacherSuccess = false;
    $scope.displayStudentInfo = false;
    $scope.displayTeacherInfo = false;

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

    /**
     * Set the active tab and pill based on selection of one or the other
     * @param {string} name - the target of the tab selected.
     */
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

    /**
     * Display search or form depending on the student task selected and set the active button
     * @param {string} task - the type of task selected.
     */
    $scope.changeStudentTask = function (task) {
        switch (studentTask) {
            case "view/edit":
                $scope.displayStudentViewSearch = false;
                break;
            case "delete":
                $scope.displayDeleteStudent = false;
                $scope.displayStudentDeleteSearch = false;
                break;
            case "add":
                $scope.displayStudentForm = false;
                break;
            default:
        }
        // set to new task
        studentTask = task;
        switch (task) {
            case "view/edit":
                $scope.displayStudentViewSearch = true;
                break;
            case "delete":
                if (studentDSearchOrInfo === "search") {
                    $scope.displayStudentDeleteSearch = true;
                } else {
                    $scope.displayStudentInfo = true;
                }
                break;
            case "add":
                $scope.displayStudentForm = true;
                break;
            default:
        }
        // remove or set active property
        setActiveButton('s', task);
    };

    /**
     * Display search or form depending on the teacher task selected and set the active button
     * @param {string} task - the type of task selected.
     */
    $scope.changeTeacherTask = function (task) {
        switch (teacherTask) {
            case "view/edit":
                $scope.displayTeacherViewSearch = false;
                break;
            case "delete":
                $scope.displayTeacherInfo = false;
                $scope.displayTeacherDeleteSearch = false;
                break;
            case "add":
                $scope.displayTeacherForm = false;
                break;
            default:
        }
        teacherTask = task;
        switch (task) {
            case "view/edit":
                $scope.displayTeacherViewSearch = true;
                break;
            case "delete":
                if (teacherDSearchOrInfo === "search") {
                    $scope.displayTeacherDeleteSearch = true;
                } else {
                    $scope.displayTeacherInfo = true;
                }
                break;
            case "add":
                $scope.displayTeacherForm = true;
                break;
            default:
        }
        // remove or set active property
        setActiveButton('t', task);
    };

    /**
     * Leaves the most recently selected button active and removes the active class from the other buttons
     * @param {string} st - 's' or 't' for student or teacher.
     * @param {string} task - the type of task selected.
     */
    function setActiveButton(st, task) {
        task == 'view/edit' ? document.getElementById(st + 'ViewButton').classList.add('active') : document.getElementById(st + 'ViewButton').classList.remove('active');
        task == 'add' ? document.getElementById(st + 'AddButton').classList.add('active') : document.getElementById(st + 'AddButton').classList.remove('active');
        task == 'delete' ? document.getElementById(st + 'DeleteButton').classList.add('active') : document.getElementById(st + 'DeleteButton').classList.remove('active');
    }

    /**
     * Navigates to student's page if name in navigation search bar is valid.
     */
    $scope.viewStudent = function () {
        if ($scope.studentViewSearch.toUpperCase() in $scope.studentsLookup) {
            $location.path('/student/' + $scope.studentsLookup[$scope.studentViewSearch.toUpperCase()].id);
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
        if ($scope.teacherViewSearch.toUpperCase() in $scope.teachersLookup) {
            //$scope.teacher = $scope.teachersLookup[$scope.teacherViewSearch.toUpperCase()];
            // display basic info that is also editable
            return;
        }
        else {
            //TODO: notify the user in some way
        }
    };

    $scope.addTeacher = function () {
        var teacherPromise = teacherService.addTeacher($scope.newTeacher);
        teacherPromise.then(function success(data) {
            $scope.newTeacher = {};
            $scope.addTeacherSuccess = true;
        }, function error(message) {
            $scope.status = message;
        });
    };

    $scope.addStudent = function () {
        var studentPromise = studentService.addStudent($scope.newStudent);
        studentPromise.then(function success(data) {
            $scope.newStudent = {};
            $scope.addStudentSuccess = true;
        }, function error(message) {
            $scope.status = message;
        });
    };

    $scope.displayDeleteTeacher = function () {
        $scope.teacherD = $scope.teachersLookup[$scope.teacherDeleteSearch.toUpperCase()];
        $scope.displayTeacherDeleteSearch = false;
        $scope.displayTeacherInfo = true;
        $scope.clearTeacherViewSearch();
        teacherDSearchOrInfo = "info";
    };

    $scope.displayDeleteStudent = function () {
        $scope.studentD = $scope.studentsLookup[$scope.studentDeleteSearch.toUpperCase()];
        $scope.displayStudentDeleteSearch = false;
        $scope.displayStudentInfo = true;
        $scope.clearStudentViewSearch();
        studentDSearchOrInfo = "info";
    };

    $scope.deleteTeacher = function () {
        var teacherPromise = teacherService.deleteTeacher($scope.teacherD.id);
        teacherPromise.then(function success(data) {
            $scope.teacherD = {};
            $scope.deleteTeacherSuccess = true;
            $scope.displayTeacherDeleteSearch = true;
            $scope.displayDeleteTeacher = false;
            teacherDSearchOrInfo = "search";
        }, function error(message) {
            $scope.status = message;
        });
    };

    $scope.deleteStudent = function () {
        var studentPromise = studentService.deleteStudent($scope.studentD.id);
        studentPromise.then(function success(data) {
            $scope.studentD = {};
            $scope.deleteStudentSuccess = true;
            $scope.displayStudentDeleteSearch = true;
            $scope.displayDeleteStudent = false;
            studentDSearchOrInfo = "search";
        }, function error(message) {
            $scope.status = message;
        });
    };

    $scope.cancelDeleteTeacher = function () {
        $scope.clearTeacherDeleteSearch();
        $scope.displayTeacherDeleteSearch = true;
        $scope.displayTeacherInfo = false;
        $scope.teacherD = {};
        teacherDSearchOrInfo = "search";
    };

    $scope.cancelDeleteStudent = function () {
        $scope.clearStudentDeleteSearch();
        $scope.displayStudentDeleteSearch = true;
        $scope.displayStudentInfo = false;
        $scope.studentD = {};
        teacherDSearchOrInfo = "search";
    };

    /**
     * Clears the view student search bar.
     */
    $scope.clearStudentViewSearch = function () {
        $scope.studentViewSearch = "";
    };

    /**
     * Clears the delete student search bar.
     */
    $scope.clearStudentDeleteSearch = function () {
        $scope.studentDeleteSearch = "";
    };

    /**
     * Clears the view teacher search bar.
     */
    $scope.clearTeacherViewSearch = function () {
        $scope.teacherViewSearch = "";
    };

    /**
     * Clears the delete teacher search bar.
     */
    $scope.clearTeacherDeleteSearch = function () {
        $scope.teacherDeleteSearch = "";
    };
});