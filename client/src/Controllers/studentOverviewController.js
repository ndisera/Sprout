app.controller("studentOverviewController", function ($rootScope, $scope, $location, $routeParams, toastService, studentService, termData, enrollmentData, userData, studentData) {
    $scope.location = $location;

    $scope.newStudentImage = null;
    $scope.newStudentImageCrop = null;
    
    // set important scope variables
    $scope.student         = studentData.student;
    $scope.enrollments     = [];
    $scope.sections        = [];
    var termsLookup        = {};
    var termSettingsLookup = {};
    var scheduleLookup     = {};

    if(termData.terms !== null && termData.terms !== undefined) {
        $scope.terms = termData.terms;
        _.each($scope.terms, function(elem) {
            elem.start_date = moment(elem.start_date);
            elem.end_date   = moment(elem.end_date);
        });
        // sort so most current first
        $scope.terms       = _.sortBy($scope.terms, function(elem) { return -elem.start_date; });
        termsLookup        = _.indexBy($scope.terms, 'id');
        termSettingsLookup = _.indexBy(termData.term_settings, 'id');
        scheduleLookup     = _.indexBy(termData.daily_schedules, 'id');
    }

    if(enrollmentData.enrollments !== null && enrollmentData.enrollments !== undefined) {
        $scope.enrollments = enrollmentData.enrollments;
    }
    if(enrollmentData.sections !== null && enrollmentData.sections !== undefined) {
        $scope.sections = _.sortBy(enrollmentData.sections, 'schedule_position');
        // set display 'period' information
        _.each($scope.sections, function(elem) {
            if(elem.schedule_position !== null) {
                var term = termsLookup[elem.term];
                var termSettings = termSettingsLookup[term.settings];
                var schedule = scheduleLookup[termSettings.schedule];
                elem.period = 'Day ' + Math.floor((elem.schedule_position / schedule.periods_per_day) + 1) + ' Period ' + ((elem.schedule_position % schedule.periods_per_day) + 1);
            }
        });
    }

    // find biggest current term
    $scope.selectedTerm = null;
    _.each($scope.terms, function(elem) {
        if(moment() > elem.start_date && moment() < elem.end_date) {
            // I have found a candidate
            // but we want the biggest current term
            if($scope.selectedTerm === null) {
                $scope.selectedTerm = elem;
            }
            else {
                // take the bigger one
                var curDelta = $scope.selectedTerm.end_date - $scope.selectedTerm.start_date;
                var newDelta = elem.end_date - elem.start_date;
                if(newDelta > curDelta) {
                    $scope.selectedTerm = elem;
                }
            }
        }
    });

    // if we're between terms (over break)
    if($scope.selectedTerm === null) {
        $scope.selectedTerm = $scope.terms[0];
    }

    $scope.selectTerm = function(term) {
        $scope.selectedTerm = term;
        $scope.termSections = _.filter($scope.sections, function(elem) { return elem.term === term.id; });
    };

    $scope.selectTerm($scope.selectedTerm);

    // create teacher lookup
    $scope.teachers = _.indexBy(userData.sprout_users, 'pk');

    // define structure for editing student fields
    $scope.editingAll = false;
    $scope.studentProperties = {
        first_name: {
            key: 'first_name',
            title: 'First Name',
            value: $scope.student.first_name,
            curValue: $scope.student.first_name,
            editable: false,
        },
        last_name: {
            key: 'last_name',
            title: 'Last Name',
            value: $scope.student.last_name,
            curValue: $scope.student.last_name,
            editable: false,
        },
        student_id: {
            key: 'student_id',
            title: 'Student ID',
            value: $scope.student.student_id,
            curValue: $scope.student.student_id,
            editable: false,
        },
        birthdate: {
            key: 'birthdate',
            title: 'Birthday',
            value: moment($scope.student.birthdate).format('YYYY-MM-DD'),
            curValue: moment($scope.student.birthdate).format('YYYY-MM-DD'),
            editable: false,
        },
    };


    /**
     * Determines whether all fields are being edited or not edited and updates
     * the editingAll variable.
     */
    function updateEditingAll() {
        if(_.every($scope.studentProperties, function(val) { return !val.editable; })) {
            $scope.editingAll = false;
        }

        if(_.every($scope.studentProperties, function(val) { return val.editable; })) {
            $scope.editingAll = true;
        }
    }

    /**
     * Begins editing a student property. Makes all properties editable
     * if 'all' is passed in.
     *
     * @param {object|string} property - student property or the string 'all'
     */
    $scope.beginEditStudent = function(property) {
        if(property === 'all') {
            $scope.editingAll = true;
            _.each($scope.studentProperties, function(value) {
                value.editable = true;
            });
        }
        else {
            property.editable = true;
            updateEditingAll();
        }
    };


    /**
     * Ends editing a student property. Makes all properties not-editable
     * if 'all' is passed in.
     *
     * @param {object|string} property - student property or the string 'all'
     */
    $scope.endEditStudent = function(property) {
        if(property === 'all') {
            $scope.editingAll = false;
            _.each($scope.studentProperties, function(value) {
                value.curValue = value.value;
                value.editable = false;
            });
        }
        else {
            property.curValue = property.value;
            property.editable = false;
            updateEditingAll();
        }
    }


    /**
     * Saves a student. Only saves the property that was confirmed.
     *
     * @param {object} property - property from studentProperties to save.
     */
    $scope.saveStudent = function(property) {
        var newStudent = {};
        _.each($scope.studentProperties, function(value, key) {
            newStudent[key] = value.value;
        });

        if(property.key === 'birthdate') {
            newStudent[property.key] = moment(property.curValue).format('YYYY-MM-DD').toString();
        }
        else {
            newStudent[property.key] = property.curValue;
        }

        studentService.updateStudent($scope.student.id, newStudent).then(
            function success(data) {
                _.each($scope.studentProperties, function(value, key) {
                    if(value.key === 'birthdate') {
                        value.value = moment(data.student[key]).format('YYYY-MM-DD');
                    }
                    else {
                        value.value = data.student[key];
                    }
                });
                $scope.student = data.student;
                $scope.studentProperties[property.key].editable = false;
                updateEditingAll();
            },
            function error(response) {
                _.each($scope.studentProperties, function(value) {
                    value.curValue = value.value;
                    value.editable = false;
                });
                $scope.editingAll = false;
                // notify the user
                toastService.error('The server wasn\'t able to update the student\'s information.');
            }
        );

    };

    var teacherLookup = _.indexBy(userData.sprout_users, 'pk');
    if($scope.student.case_manager !== null && $scope.student.case_manager !== undefined) {
        // student has case manager
        $scope.caseManager = teacherLookup[$scope.student.case_manager];
    }
    else {
        // student does not yet have case manager
        $scope.caseManager = {
            pk: null,
            first_name: 'NO CASE',
            last_name: 'MANAGER',
        };
    }

    $scope.caseManagers = _.clone(userData.sprout_users);

    $scope.selectCaseManager = function(caseManager) {
        var editedStudent = _.clone($scope.student);
        editedStudent.case_manager = caseManager.pk;
        studentService.updateStudent(editedStudent.id, editedStudent).then(
            function success(data) {
                $scope.student = editedStudent;
                $scope.caseManager = teacherLookup[$scope.student.case_manager];
            },
            function error(response) {
                // notify the user
                toastService.error('The server wasn\'t able to assign the student\'s case manager.');
            }
        );
    };

    /*** IMAGE RELATED ***/

    $scope.uploadStudentImage = function(image) {
        studentService.addStudentPicture($scope.student.id, { file: image, }).then(
            function success(data) {
                $rootScope.currentStudent.id = $scope.student.id;
                $rootScope.currentStudent.picture = data.profile_picture.file;

                $scope.closeModal();
            },
            function error(response) {
                toastService.error('The server wasn\'t able to save your image.');
            },
        );
    };

    $scope.showModal = function() {
        if(!($('#student-overview-image-modal').data('bs.modal') || {}).isShown) {
            $('#student-overview-image-modal').modal('toggle');
            $scope.newStudentImage = null;
            $scope.newStudentImageCrop = null;
        }
    };

    $scope.closeModal = function() {
        if(($('#student-overview-image-modal').data('bs.modal') || {}).isShown) {
            $('#student-overview-image-modal').modal('toggle');
        }
    };


});

