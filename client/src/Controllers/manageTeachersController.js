app.controller("manageTeachersController", function($scope, $rootScope, $location, toastService, userData, userService, sectionService, termData, termService, $timeout) {
    $scope.location = $location;

    $scope.user = userService.user; // for case of editing or deleting oneself

    $scope.sendingAccessEmail = false;
    $scope.sendingResetEmail = false;

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

    var termsLookup = {};
    var termSettingsLookup = {};
    var scheduleLookup = {};

    $scope.terms = [];
    $scope.selectedTerm = null;
    var currentTerms = [];
    var currentTermsLookup = {};

    if (termData.terms !== null && termData.terms !== undefined) {
        $scope.terms = termService.transformAndSortTerms(termData.terms);
        termsLookup = _.indexBy($scope.terms, 'id');
        termSettingsLookup = _.indexBy(termData.term_settings, 'id');
        scheduleLookup = _.indexBy(termData.daily_schedules, 'id');

        currentTerms = termService.getAllCurrentTerms(termData.terms);

        // set up an option for all current terms
        if (currentTerms.length > 0) {
            // create special term for all current terms
            $scope.terms.unshift({
                id: -1,
                name: 'All Current Terms',
            });
            currentTermsLookup = _.indexBy(currentTerms, 'id');
        }

        // select a term
        $scope.selectedTerm = $scope.terms[0];
    }

    $scope.selectTerm = function(term) {
        $scope.selectedTerm = term;

        var sectionsForTermFilter = null;
        if (term.id === -1) {
            // all current terms
            sectionsForTermFilter = function(elem) {
                return _.has(currentTermsLookup, elem.term);
            };
        } else {
            sectionsForTermFilter = function(elem) {
                return elem.term === term.id;
            };
        }
        $scope.termSections = _.filter($scope.sections, sectionsForTermFilter);
    };

    if ($scope.terms.length > 0) {
        $scope.selectTerm($scope.selectedTerm);
    }

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
            $scope.sections = _.sortBy(data.sections, 'schedule_position');
            // set display 'period' information
            _.each($scope.sections, function(elem) {
                if (elem.schedule_position !== null) {
                    var term = termsLookup[elem.term];
                    var termSettings = termSettingsLookup[term.settings];
                    var schedule = scheduleLookup[termSettings.schedule];
                    elem.period = 'Day ' + Math.floor((elem.schedule_position / schedule.periods_per_day) + 1) + ' Period ' + ((elem.schedule_position % schedule.periods_per_day) + 1);
                }
            });
            if ($scope.terms.length > 0) {
                $scope.selectTerm($scope.selectedTerm);
            }
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
        $scope.errorMessage = response.data;
    }

    /**
     * Attempts to send a password reset link to email
     * @param {boolean} passwordReset - true for reset, false for grant access
     */
    $scope.attemptPasswordReset = function(passwordReset) {
        $scope.sendingAccessEmail = !passwordReset;
        $scope.sendingResetEmail = passwordReset;
        // use selected teacher's email
        userService.resetPassword($scope.teacherV.email).then(
            function success(response) {
                $scope.sendingAccessEmail = false;
                $scope.sendingResetEmail = false;
                var message = passwordReset ? "An email containing instructions to reset this teacher's password has been sent to " :
                    "An email to grant access to this teacher has been sent to ";
                toastService.success(message + $scope.teacherV.email + ".");
            },
            function error(response) {
                $scope.sendingAccessEmail = false;
                $scope.sendingResetEmail = false;
                setErrorMessage(response);
                toastService.error("There was an error trying to send an email to this teacher." + errorResponse());
            }
        );
    };
});
