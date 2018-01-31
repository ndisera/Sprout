app.controller("manageTeachersController", function ($scope, $rootScope, $location, teachers, teacherService) {

    var teacherTask = "view/edit";
    var teacherVSearchOrInfo = "search";
    var teacherDSearchOrInfo = "search";
    $scope.displayTeacherViewSearch = true;
    $scope.displayTeacherDeleteSearch = false;
    $scope.displayTeacherForm = false;
    $scope.displayTeacherInfo = false;
    $scope.displayTEditInfo = false;
    $scope.viewTUsername = true;
    $scope.viewTFirstName = true;
    $scope.viewTLastName = true;
    $scope.viewTEmail = true;
    $scope.addTeacherSuccess = false;
    $scope.deleteTeacherSuccess = false;
    $scope.teachersLookup = {};
    $scope.teacherV = {};
    $scope.teacherE = {};
    $scope.teacherD = {};
    $scope.newTeacher = {};
    $scope.teachers = teachers.teachers;

    // create fast lookup teacher dictionary
    for (var i = 0; i < $scope.teachers.length; ++i) {
        var lookupName = $scope.teachers[i].first_name + " " + $scope.teachers[i].last_name;
        $scope.teachersLookup[lookupName.toUpperCase()] = $scope.teachers[i];
    }

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
        setActiveButton(task);
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
            $("#addTeacherSuccess").fadeTo(2000, 500).slideUp(500, function () {
                $("#addTeacherSuccess").slideUp(500);
            });
            $scope.teachers.push(data.teacher);
            var lookupName = data.teacher.first_name + " " + data.teacher.last_name;
            $scope.teachersLookup[lookupName.toUpperCase()] = data.teacher;
        }, function error(response) {
            setErrorMessage(response);
            $scope.addTeacherFailure = true;
            $("#addTeacherFailure").fadeTo(5000, 500).slideUp(500, function () {
                $("#addTeacherFailure").slideUp(500);
            });
        });
    };

    /**
     * Hides the delete teacher search bar and displays their info with an option to delete.
     */
    $scope.displayDeleteTeacher = function () {
        if ($scope.teacherDeleteSearch.toUpperCase() in $scope.teachersLookup) {
            $scope.teacherD = $scope.teachersLookup[$scope.teacherDeleteSearch.toUpperCase()];
            $scope.displayTeacherDeleteSearch = false;
            $scope.displayTeacherInfo = true;
            $scope.clearTeacherDeleteSearch();
            teacherDSearchOrInfo = "info";
        }
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
            var id = $scope.teacherD.id;
            $scope.teacherD = {};
            $scope.deleteTeacherSuccess = true;
            $("#deleteTeacherSuccess").fadeTo(2000, 500).slideUp(500, function () {
                $("#deleteTeacherSuccess").slideUp(500);
            });
            $scope.displayTeacherDeleteSearch = true;
            $scope.displayTeacherInfo = false;
            teacherDSearchOrInfo = "search";
            $scope.teacherDeleteSearch = "";
            // check to see if teacherV/E is this deleted teacher and change view accordingly
            if ($scope.teacherV.id === id) {
                $scope.teacherV = {};
                $scope.teacherE = {};
                $scope.displayTEditInfo = false;
                teacherVSearchOrInfo = "search";
                $scope.clearTeacherViewSearch();
                $scope.tUsername = "";
                $scope.tFirstName = "";
                $scope.tLastName = "";
                $scope.tEmail = "";
            }
        }, function error(response) {
            setErrorMessage(response);
            $scope.deleteTeacherFailure = true;
            $("#deleteTeacherFailure").fadeTo(5000, 500).slideUp(500, function () {
                $("#deleteTeacherFailure").slideUp(500);
            });
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
            // need to see if same teacher is currently selected for delete and update if so
            if ($scope.teacherE.id === $scope.teacherD.id) {
                $scope.teacherD = Object.assign({}, $scope.teacherE);
            }
            // save previous name in case it was changed
            var tempFirstName = $scope.teacherV.first_name.toUpperCase();
            var tempLastName = $scope.teacherV.last_name.toUpperCase();
            var tempFullName = tempFirstName + " " + tempLastName
            // set teacherV to teacherE to reflect update
            $scope.teacherV = Object.assign({}, $scope.teacherE);
            var newFullName = $scope.teacherV.first_name + " " + $scope.teacherV.last_name;
            // then have to update teachers and lookup
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
                    // need to delete that lookup property
                    delete $scope.teachersLookup[tempFullName];
                    $scope.teacherViewSearch = newFullName;
                    $scope.viewTFirstName = true;
                    $scope.tFirstName = "";
                    break;
                case "lastname":
                    // need to delete that lookup property
                    delete $scope.teachersLookup[tempFullName];
                    $scope.teacherViewSearch = newFullName;
                    $scope.viewTLastName = true;
                    $scope.tLastName = "";
                    break;
                case "email":
                    $scope.viewTEmail = true;
                    $scope.tEmail = "";
                    break;
                default:
            }
        }, function error(response) {
            setErrorMessage(response);
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

    /**
     * Leaves the most recently selected button active and removes the active class from the other buttons
     * @param {string} task - the type of task selected.
     */
    function setActiveButton(task) {
        if (task === 'view/edit') {
            document.getElementById('tViewButton').classList.add('active');
            document.getElementById('tViewButton2').classList.add('active');
        } else {
            document.getElementById('tViewButton').classList.remove('active');
            document.getElementById('tViewButton2').classList.remove('active');
        }
        if (task === 'add') {
            document.getElementById('tAddButton').classList.add('active');
            document.getElementById('tAddButton2').classList.add('active');
        } else {
            document.getElementById('tAddButton').classList.remove('active');
            document.getElementById('tAddButton2').classList.remove('active');
        }
        if (task === 'delete') {
            document.getElementById('tDeleteButton').classList.add('active');
            document.getElementById('tDeleteButton2').classList.add('active');
        } else {
            document.getElementById('tDeleteButton').classList.remove('active');
            document.getElementById('tDeleteButton2').classList.remove('active');
        }
    }

    function setErrorMessage(response) {
        $scope.errorMessage = [];
        for (var property in response.data) {
            if (response.data.hasOwnProperty(property)) {
                for (var i = 0; i < response.data[property].length; i++) {
                    $scope.errorMessage.push(response.data[property][i]);
                }
            }
        }
        $scope.errorMessage = $scope.errorMessage.join(" ");
    }
})