app.controller("manageTeachersController", function($scope, $rootScope, $location, userData, userService, sectionService) {

    var teacherTask = "view/edit";
    $scope.displayTeacherViewSearch = true;
    $scope.displayTeacherDeleteSearch = false;
    $scope.displayTeacherForm = false;
    $scope.displayTEditInfo = false;
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
    $scope.teachers = userData.sprout_users;
    $scope.editingAll = true;

    /**
     * Sets teacherD.
     * @param {teacher} teacher - teacher used to set.
     */
    $scope.setTeacherD = function(teacher) {
        $scope.teacherD = teacher;
    };

    /**
     * Grabs all classes taught by the selected teacher.
     */
    function getTeacherClasses() {
        var sectionsPromise = sectionService.getSections({
            filter: [{
                name: 'teacher',
                val: $scope.teacherV.pk
            }],
        });
        sectionsPromise.then(function success(data) {
            $scope.sections = data.sections;
        }, function error(response) {
            $scope.errorMessage = response;
        });
    };

    // create fast lookup teacher dictionary
    for (var i = 0; i < $scope.teachers.length; ++i) {
        var lookupName = $scope.teachers[i].first_name + " " + $scope.teachers[i].last_name;
        $scope.teachersLookup[lookupName.toUpperCase()] = $scope.teachers[i];
    }

    /**
     * Display search or form depending on the teacher task selected and set the active button
     * @param {string} task - the type of task selected.
     */
    $scope.changeTeacherTask = function(task) {
        switch (teacherTask) {
            case "view/edit":
                $scope.displayTeacherViewSearch = false;
                break;
            case "delete":
                $scope.displayTeacherDeleteSearch = false;
                $scope.deleteTeacherSuccess = false;
                $scope.deleteTeacherFailure = false;
                break;
            case "add":
                $scope.displayTeacherForm = false;
                $scope.addTeacherSuccess = false;
                $scope.addTeacherFailure = false;
                break;
            default:
        }
        teacherTask = task;
        switch (task) {
            case "view/edit":
                $scope.displayTeacherViewSearch = true;
                break;
            case "delete":
                $scope.displayTeacherDeleteSearch = true;
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
    $scope.viewTeacher = function(teacher) {
        $scope.teacherV = teacher;
        // copy teacherV to teacherE
        $scope.teacherE = Object.assign({}, $scope.teacherV);
        $scope.displayTEditInfo = true;
        // make sure edit is still not displayed when switching
        $scope.viewTFirstName = true;
        $scope.viewTLastName = true;
        $scope.viewTEmail = true;
        getTeacherClasses();
    };

    /**
     * Creates and adds a new teacher.
     */
    $scope.addTeacher = function() {
        var teacherPromise = userService.createUser($scope.newTeacher);
        teacherPromise.then(function success(data) {
            $scope.newTeacher = {};
            $scope.addTeacherSuccess = true;
            $("#addTeacherSuccess").fadeTo(2000, 500).slideUp(500, function() {
                $("#addTeacherSuccess").slideUp(500);
            });
            $scope.teachers.push(data.user);
            var lookupName = data.user.first_name + " " + data.user.last_name;
            $scope.teachersLookup[lookupName.toUpperCase()] = data.user;
        }, function error(response) {
            setErrorMessage(response);
            $scope.addTeacherFailure = true;
            $("#addTeacherFailure").fadeTo(5000, 500).slideUp(500, function() {
                $("#addTeacherFailure").slideUp(500);
            });
        });
    };

    /**
     * Hides the delete teacher search bar and displays their info with an option to delete.
     */
    $scope.displayDeleteTeacher = function() {
        if ($scope.teacherDeleteSearch.toUpperCase() in $scope.teachersLookup) {
            $scope.teacherD = $scope.teachersLookup[$scope.teacherDeleteSearch.toUpperCase()];
            $scope.displayTeacherDeleteSearch = false;
            $scope.clearTeacherDeleteSearch();
        }
    };

    /**
     * Filter used for viewing teachers
     * @param {teacher} teacher - teacher to be filtered.
     */
    $scope.viewTeacherFilter = function(teacher) {
        if ($scope.teacherViewSearch == null) {
            return true;
        }
        var input = $scope.teacherViewSearch.toUpperCase();
        var fullname = teacher.first_name + " " + teacher.last_name;
        if (teacher.first_name.toUpperCase().includes(input) ||
            teacher.last_name.toUpperCase().includes(input) || teacher.email.toUpperCase().includes(input) ||
            fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }

    /**
     * Filter used for deleting teachers
     * @param {teacher} teacher - teacher to be filtered.
     */
    $scope.deleteTeacherFilter = function(teacher) {
        if ($scope.teacherDeleteSearch == null) {
            return true;
        }
        var input = $scope.teacherDeleteSearch.toUpperCase();
        var fullname = teacher.first_name + " " + teacher.last_name;
        if (teacher.first_name.toUpperCase().includes(input) ||
            teacher.last_name.toUpperCase().includes(input) || teacher.email.toUpperCase().includes(input) ||
            fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }

    /**
     * Deletes the selected teacher from the database.
     */
    $scope.deleteTeacher = function() {
        var teacherPromise = userService.deleteUser($scope.teacherD.pk);
        teacherPromise.then(function success(data) {
            // remove teacher from teachers and teachersLookup
            for (var i = 0; i < $scope.teachers.length; i++) {
                if ($scope.teachers[i].pk === $scope.teacherD.pk) {
                    $scope.teachers.splice(i, 1);
                    var upper = $scope.teacherD.first_name.toUpperCase() + " " + $scope.teacherD.last_name.toUpperCase();
                    delete $scope.teachersLookup[upper];
                }
            }
            var pk = $scope.teacherD.pk;
            $scope.teacherD = {};
            $scope.deleteTeacherSuccess = true;
            $("#deleteTeacherSuccess").fadeTo(2000, 500).slideUp(500, function() {
                $("#deleteTeacherSuccess").slideUp(500);
            });
            $scope.displayTeacherDeleteSearch = true;
            $scope.teacherDeleteSearch = "";
            // check to see if teacherV/E is this deleted teacher and change view accordingly
            if ($scope.teacherV.pk === pk) {
                $scope.teacherV = {};
                $scope.teacherE = {};
                $scope.clearTeacherViewSearch();
                $scope.tFirstName = "";
                $scope.tLastName = "";
                $scope.tEmail = "";
            }
        }, function error(response) {
            setErrorMessage(response);
            $scope.deleteTeacherFailure = true;
            $("#deleteTeacherFailure").fadeTo(5000, 500).slideUp(500, function() {
                $("#deleteTeacherFailure").slideUp(500);
            });
        });
    };

    /**
     * Turns the displayed teacher field into an editable input.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.editTeacher = function(field) {
        switch (field) {
            case "firstname":
                $scope.viewTFirstName = false;
                checkIfAllSelected();
                break;
            case "lastname":
                $scope.viewTLastName = false;
                checkIfAllSelected();
                break;
            case "email":
                $scope.viewTEmail = false;
                checkIfAllSelected();
                break;
            case "none":
                $scope.viewTFirstName = true;
                $scope.viewTLastName = true;
                $scope.viewTEmail = true;
                $scope.editingAll = true;
                break;
            case "all":
                $scope.viewTFirstName = false;
                $scope.viewTLastName = false;
                $scope.viewTEmail = false;
                $scope.editingAll = false;
                break;
            default:
        }
    };

    /**
     * Sets edit all button according to what edit fields are ready to edit.
     */
    function checkIfAllSelected() {
        if ($scope.viewTFirstName === true && $scope.viewTLastName === true && $scope.viewTEmail === true) {
            $scope.editingAll = true;
        } else if ($scope.viewTFirstName === false && $scope.viewTLastName === false && $scope.viewTEmail === false) {
            $scope.editingAll = false;
        }
    }

    /**
     * Updates the selected Teacher with the newly edited field.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.saveTEdit = function(field) {
        switch (field) {
            // update field
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
        delete tempTeacher.pk;
        var teacherPromise = userService.updateUser($scope.teacherE.pk, tempTeacher);
        teacherPromise.then(function success(data) {
            // need to see if same teacher is currently selected for delete and update if so
            if ($scope.teacherE.pk === $scope.teacherD.pk) {
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
                if ($scope.teachers[i].pk === $scope.teacherE.pk) {
                    $scope.teachers[i] = Object.assign({}, $scope.teacherE);
                    var upper = $scope.teacherE.first_name.toUpperCase() + " " + $scope.teacherE.last_name.toUpperCase();
                    $scope.teachersLookup[upper] = Object.assign({}, $scope.teacherE);
                }
            }
            switch (field) {
                // set view after call returns
                case "firstname":
                    // need to delete that lookup property
                    delete $scope.teachersLookup[tempFullName];
                    $scope.viewTFirstName = true;
                    $scope.tFirstName = "";
                    break;
                case "lastname":
                    // need to delete that lookup property
                    delete $scope.teachersLookup[tempFullName];
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
    $scope.cancelTEdit = function(field) {
        switch (field) {
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
        checkIfAllSelected();
    };

    /**
     * Clears the view teacher search bar.
     */
    $scope.clearTeacherViewSearch = function() {
        if ($scope.displayTEditInfo === true) {
            $scope.displayTEditInfo = false;
        }
    };

    /**
     * Clears the delete teacher search bar.
     */
    $scope.clearTeacherDeleteSearch = function() {
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

    /**
     * Updates the displayed error message.
     * @param {response} response - response containing data and error message.
     */
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
