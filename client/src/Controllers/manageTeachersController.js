app.controller("manageTeachersController", function($scope, $rootScope, $location, toastService, userData, userService, sectionService, termsInfo) {
    $scope.location = $location;

    $scope.user = userService.user; // for case of editing or deleting oneself

    var teacherTask = "view/edit";
    $scope.displayTeacherViewSearch = true;
    $scope.displayTeacherForm = false;
    $scope.displayTEditInfo = false;
    $scope.teacherEdit = false;
    $scope.teachersLookup = {};
    $scope.teacherV = {};
    $scope.teacherE = {};
    $scope.teacherD = {};
    $scope.newTeacher = {};
    $scope.teachers = userData.sprout_users;
    $scope.editingAll = true;
    var terms = termsInfo.terms;
    var termSettings = _.indexBy(termsInfo.term_settings, "id");
    var dailySchedules = _.indexBy(termsInfo.daily_schedules, "id");

    $scope.toggleTeacherEdit = function() {
        $scope.teacherEdit = !$scope.teacherEdit;
    };

    /**
     * Extra part of error message
     */
    function errorResponse() {
        var message = "";
        if ($scope.errorMessage != null && $scope.errorMessage !== "") {
            message = " Error message: " + $scope.errorMessage;
        }
        return message;
    }

    /**
     * Sets teacherD.
     * @param {teacher} teacher - teacher used to set.
     */
    $scope.setTeacherD = function(teacher) {
        $scope.teacherD = teacher;
        $("#deleteTeacherModal").modal();
    };

    /**
     * Creates the display periods based on the current term
     * @param {string} currentDate - today's date.
     */
    function getDisplayPeriods(currentDate) {
        $scope.currentTermPeriods = [];
        for (var i = 0; i < terms.length; i++) {
            if (terms[i].start_date <= currentDate && terms[i].end_date >= currentDate) {
                var schedule = dailySchedules[termSettings[terms[i].settings].schedule];
                var day = 1;
                var period = 0;
                var noDays = schedule.total_periods === schedule.periods_per_day;
                for (var j = 0; j < schedule.total_periods; j++) {
                    period++;
                    if (period > schedule.periods_per_day) {
                        day++;
                        period = 1;
                    }
                    noDays ? $scope.currentTermPeriods.push("Period " + period) : $scope.currentTermPeriods.push("Day " + day + " Period " + period);
                }
                break; // should only be one term that matches
            }
        }
    }

    /**
     * Gets today's date
     */
    function getCurrentDate() {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        today = yyyy + "-" + mm + '-' + dd;
        return today;
    }

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
            var currentDate = getCurrentDate();
            // this fills $scope.currentTermPeriods
            getDisplayPeriods(currentDate);
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to get the teacher's classes." + errorResponse());
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
            case "add":
                $scope.displayTeacherForm = true;
                break;
            default:
        }
    };

    /**
     * Displays teacher info if name in teacher search bar is valid.
     */
    $scope.viewTeacher = function(teacher) {
        $scope.teacherV = teacher;
        // copy teacherV to teacherE
        $scope.teacherE = Object.assign({}, $scope.teacherV);
        $scope.displayTEditInfo = true;
        $scope.teacherEdit = false;
        getTeacherClasses();
    };

    /**
     * Creates and adds a new teacher.
     */
    $scope.addTeacher = function() {
        var teacherPromise = userService.createUser($scope.newTeacher);
        teacherPromise.then(function success(data) {
            $scope.newTeacher = {};
            toastService.success("New teacher has been added.");
            $scope.teachers.push(data.user);
            var lookupName = data.user.first_name + " " + data.user.last_name;
            $scope.teachersLookup[lookupName.toUpperCase()] = data.user;
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to add the teacher." + errorResponse());
        });
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
            toastService.error("The server was unable to delete the teacher." + errorResponse());
        });
    };

    /**
     * Updates the selected Teacher with the newly edited field.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.saveTEdit = function(field) {
        // save with teacherE
        var tempTeacher = Object.assign({}, $scope.teacherE);
        delete tempTeacher.pk;
        var teacherPromise = userService.updateUser($scope.teacherE.pk, tempTeacher);
        teacherPromise.then(function success(data) {
            // save previous name in case it was changed and delete from lookup
            if ($scope.teacherE.first_name !== $scope.teacherV.first_name || $scope.teacherE.last_name !== $scope.teacherV.last_name) {
                var tempFirstName = $scope.teacherV.first_name.toUpperCase();
                var tempLastName = $scope.teacherV.last_name.toUpperCase();
                var tempFullName = tempFirstName + " " + tempLastName
                delete $scope.teachersLookup[tempFullName];
            }
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
            $scope.teacherEdit = false;
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to save your edit." + errorResponse());
        });
    };

    /**
     * Restored the previous display of the selected teacher field and hides the editable input box.
     */
    $scope.cancelTEdit = function() {
        $scope.teacherEdit = false;
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
});
