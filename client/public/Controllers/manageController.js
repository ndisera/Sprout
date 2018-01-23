app.controller("manageController", function ($scope, $rootScope, $location, students, teachers, studentService, teacherService) {
    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }

    var teacherTask = "view/edit";
    var studentTask = "view/edit";
    var teacherVSearchOrInfo = "search";
    var teacherDSearchOrInfo = "search";
    var studentDSearchOrInfo = "search";

    $scope.displayStudentViewSearch = true;
    $scope.displayStudentDeleteSearch = false;
    $scope.displayStudentForm = false;
    $scope.displayTeacherViewSearch = true;
    $scope.displayTeacherDeleteSearch = false;
    $scope.displayTeacherForm = false;
    $scope.displayStudentInfo = false;
    $scope.displayTeacherInfo = false;
    $scope.displayTEditInfo = false;

    $scope.viewTUsername = true;
    $scope.viewTFirstName = true;
    $scope.viewTLastName = true;
    $scope.viewTEmail = true;

    $scope.addStudentSuccess = false;
    $scope.addTeacherSuccess = false;
    $scope.deleteStudentSuccess = false;
    $scope.deleteTeacherSuccess = false;

    $scope.students = students;
    $scope.teachers = teachers;
    $scope.studentsLookup = {};
    $scope.teachersLookup = {};
    $scope.teacherV = {};
    $scope.teacherE = {};
    $scope.studentD = {};
    $scope.teacherD = {};
    $scope.newTeacher = {};
    $scope.newStudent = {};

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
                $scope.deleteStudentSuccess = false;
                break;
            case "add":
                $scope.displayStudentForm = false;
                $scope.addStudentSuccess = false;
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
                $scope.displayTEditInfo = false;
                break;
            case "delete":
                $scope.displayTeacherInfo = false;
                $scope.displayTeacherDeleteSearch = false;
                $scope.deleteTeacherSuccess = false;
                break;
            case "add":
                $scope.displayTeacherForm = false;
                $scope.addTeacherSuccess = false;
                break;
            default:
        }
        teacherTask = task;
        switch (task) {
            case "view/edit":
                $scope.displayTeacherViewSearch = true;
                if (teacherVSearchOrInfo === "info") {
                    $scope.displayTEditInfo = true;
                }
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
        if (task === 'view/edit') {
            document.getElementById(st + 'ViewButton').classList.add('active');
            document.getElementById(st + 'ViewButton2').classList.add('active');
        } else {
            document.getElementById(st + 'ViewButton').classList.remove('active');
            document.getElementById(st + 'ViewButton2').classList.remove('active');
        }
        if (task === 'add') {
            document.getElementById(st + 'AddButton').classList.add('active');
            document.getElementById(st + 'AddButton2').classList.add('active');
        } else {
            document.getElementById(st + 'AddButton').classList.remove('active');
            document.getElementById(st + 'AddButton2').classList.remove('active');
        }
        if (task === 'delete') {
            document.getElementById(st + 'DeleteButton').classList.add('active');
            document.getElementById(st + 'DeleteButton2').classList.add('active');
        } else {
            document.getElementById(st + 'DeleteButton').classList.remove('active');
            document.getElementById(st + 'DeleteButton2').classList.remove('active');
        }
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
            $scope.teacherV = $scope.teachersLookup[$scope.teacherViewSearch.toUpperCase()];
            // copy teacherV to teacherE
            $scope.teacherE = Object.assign({}, $scope.teacherV);
            $scope.displayTEditInfo = true;
            teacherVSearchOrInfo = "info";
            // make sure edit is still not displayed when switching
            $scope.viewTUsername = true;
            $scope.viewTFirstName = true;
            $scope.viewTLastName = true;
            $scope.viewTEmail = true;
        }
        else {
            //TODO: notify the user in some way
        }
    };

    /**
     * Creates and adds a new teacher.
     */
    $scope.addTeacher = function () {
        var teacherPromise = teacherService.addTeacher($scope.newTeacher);
        teacherPromise.then(function success(data) {
            $scope.newTeacher = {};
            $scope.addTeacherSuccess = true;
            $scope.teachers.push(data);
            var lookupName = data.first_name + " " + data.last_name;
            $scope.teachersLookup[lookupName.toUpperCase()] = data;
        }, function error(message) {
            $scope.status = message;
        });
    };

    /**
     * Creates and adds a new student.
     */
    $scope.addStudent = function () {
        var studentPromise = studentService.addStudent($scope.newStudent);
        studentPromise.then(function success(data) {
            $scope.newStudent = {};
            $scope.addStudentSuccess = true;
            $scope.students.push(data);
            var lookupName = data.first_name + " " + data.last_name;
            $scope.studentsLookup[lookupName.toUpperCase()] = data;
        }, function error(message) {
            $scope.status = message;
        });
    };

    /**
     * Hides the delete teacher search bar and displays their info with an option to delete.
     */
    $scope.displayDeleteTeacher = function () {
        $scope.teacherD = $scope.teachersLookup[$scope.teacherDeleteSearch.toUpperCase()];
        $scope.displayTeacherDeleteSearch = false;
        $scope.displayTeacherInfo = true;
        $scope.clearTeacherViewSearch();
        teacherDSearchOrInfo = "info";
    };

    /**
     * Hides the delete student search bar and displays their info with an option to delete.
     */
    $scope.displayDeleteStudent = function () {
        $scope.studentD = $scope.studentsLookup[$scope.studentDeleteSearch.toUpperCase()];
        $scope.displayStudentDeleteSearch = false;
        $scope.displayStudentInfo = true;
        $scope.clearStudentViewSearch();
        studentDSearchOrInfo = "info";
    };

    /**
     * Deletes the selected teacher from the database.
     */
    $scope.deleteTeacher = function () {
        var teacherPromise = teacherService.deleteTeacher($scope.teacherD.id);
        teacherPromise.then(function success(data) {
            // remove teacher from teachers and teachersLookup
            for (var i = 0; i < $scope.teachers.length; i++) {
                if ($scope.teachers[i].id === $scope.teacherD.id) {
                    $scope.teachers.splice(i, 1);
                    var upper = $scope.teacherD.first_name.toUpperCase() + " " + $scope.teacherD.last_name.toUpperCase();
                    delete $scope.teachersLookup[upper];
                }
            }
            $scope.teacherD = {};
            $scope.deleteTeacherSuccess = true;
            $scope.displayTeacherDeleteSearch = true;
            $scope.displayTeacherInfo = false;
            teacherDSearchOrInfo = "search";
            $scope.teacherDeleteSearch = "";
        }, function error(message) {
            $scope.status = message;
        });
    };

    /**
     * Deletes the selected student from the database.
     */
    $scope.deleteStudent = function () {
        var studentPromise = studentService.deleteStudent($scope.studentD.id);
        studentPromise.then(function success(data) {
            // remove student from students and studentsLookup
            for (var i = 0; i < $scope.students.length; i++) {
                if ($scope.students[i].id === $scope.studentD.id) {
                    $scope.students.splice(i, 1);
                    var upper = $scope.studentD.first_name.toUpperCase() + " " + $scope.studentD.last_name.toUpperCase();
                    delete $scope.studentsLookup[upper];
                }
            }
            $scope.studentD = {};
            $scope.deleteStudentSuccess = true;
            $scope.displayStudentDeleteSearch = true;
            $scope.displayStudentInfo = false;
            studentDSearchOrInfo = "search";
            $scope.studentDeleteSearch = "";
        }, function error(message) {
            $scope.status = message;
        });
    };

    /**
     * Restores the delete teacher search box and hides their info and delete option.
     */
    $scope.cancelDeleteTeacher = function () {
        $scope.clearTeacherDeleteSearch();
        $scope.displayTeacherDeleteSearch = true;
        $scope.displayTeacherInfo = false;
        $scope.teacherD = {};
        teacherDSearchOrInfo = "search";
    };

    /**
     * Restores the delete student search box and hides their info and delete option.
     */
    $scope.cancelDeleteStudent = function () {
        $scope.clearStudentDeleteSearch();
        $scope.displayStudentDeleteSearch = true;
        $scope.displayStudentInfo = false;
        $scope.studentD = {};
        teacherDSearchOrInfo = "search";
    };

    /**
     * Turns the displayed teacher field into an editable input.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.editTeacher = function (field) {
        switch (field) {
            case "username":
                $scope.viewTUsername = false;
                break;
            case "firstname":
                $scope.viewTFirstName = false;
                break;
            case "lastname":
                $scope.viewTLastName = false;
                break;
            case "email":
                $scope.viewTEmail = false;
                break;
            default:
        }
    };


    /**
     * Updates the selected Teacher with the newly edited field.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.saveTEdit = function (field) {
        switch (field) {
            // update field
            case "username":
                $scope.teacherE.username = $scope.tUsername;
                break;
            case "firstname":
                $scope.teacherE.first_name = $scope.tFirstName;
                break;
            case "lastname":
                $scope.teacherE.last_name = $scope.tLastName;
                break;
            case "email":
                $scope.teacherE.email = $scope.tEmail;
                break;
            default:
        }
        // save with teacherE
        var tempTeacher = Object.assign({}, $scope.teacherE);
        delete tempTeacher.id;
        var teacherPromise = teacherService.updateTeacher($scope.teacherE.id, tempTeacher);
        teacherPromise.then(function success(data) {
            // set teacherV to teacherE to reflect update
            $scope.teacherV = Object.assign({}, $scope.teacherE);
            // then have to update teachers and lookup but I'll have them all point to teacherService teachers
            for (var i = 0; i < $scope.teachers.length; i++) {
                if ($scope.teachers[i].id === $scope.teacherE.id) {
                    $scope.teachers[i] = Object.assign({}, $scope.teacherE);
                    var upper = $scope.teacherE.first_name.toUpperCase() + " " + $scope.teacherE.last_name.toUpperCase();
                    $scope.teachersLookup[upper] = Object.assign({}, $scope.teacherE);
                }
            }
            switch (field) {
                // set view after call returns
                case "username":
                    $scope.viewTUsername = true;
                    $scope.tUsername = "";
                    break;
                case "firstname":
                    $scope.viewTFirstName = true;
                    $scope.tFirstName = "";
                    break;
                case "lastname":
                    $scope.viewTLastName = true;
                    $scope.tLastName = "";
                    break;
                case "email":
                    $scope.viewTEmail = true;
                    $scope.tEmail = "";
                    break;
                default:
            }
        }, function error(message) {
            $scope.status = message;
        });
    };

    /**
     * Restored the previous display of the selected teacher field and hides the editable input box.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.cancelTEdit = function (field) {
        switch (field) {
            case "username":
                $scope.viewTUsername = true;
                $scope.tUsername = "";
                break;
            case "firstname":
                $scope.viewTFirstName = true;
                $scope.tFirstName = "";
                break;
            case "lastname":
                $scope.viewTLastName = true;
                $scope.tLastName = "";
                break;
            case "email":
                $scope.viewTEmail = true;
                $scope.tEmail = "";
                break;
            default:
        }
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