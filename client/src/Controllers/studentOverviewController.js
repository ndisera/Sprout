app.controller("studentOverviewController", function ($rootScope, $scope, $location, $routeParams, toastService, userService, studentService, termService, termData, enrollmentData, userData, studentData, parentContactData, school) {
    $scope.location = $location;

    // school settings should have 1 entry
    $scope.gradeLevels = [];
    var schoolSetting = null;
    if(school && school.school_settings) {
        schoolSettings = school.school_settings[0];
        for(var i = schoolSettings.grade_range_lower; i <= schoolSettings.grade_range_upper; ++i) {
            $scope.gradeLevels.push(i);
        }
    }

    $scope.newStudentImage = null;
    $scope.newStudentImageCrop = null;
    
    // set important scope variables
    $scope.student         = studentData.student;
    $scope.enrollments     = [];
    $scope.sections        = [];
    var termsLookup        = {};
    var termSettingsLookup = {};
    var scheduleLookup     = {};

    $scope.terms = [];
    $scope.selectedTerm = null;
    var currentTerms = [];
    var currentTermsLookup = {};

    $scope.isSuperUser = userService.user.isSuperUser;
    $scope.isCaseManager = false;
    if($scope.student.case_manager === userService.user.id) {
        $scope.isCaseManager = true;
    }

    if(termData.terms !== null && termData.terms !== undefined) {
        $scope.terms       = termService.transformAndSortTerms(termData.terms);
        termsLookup        = _.indexBy($scope.terms, 'id');
        termSettingsLookup = _.indexBy(termData.term_settings, 'id');
        scheduleLookup     = _.indexBy(termData.daily_schedules, 'id');

        currentTerms = termService.getAllCurrentTerms(termData.terms);

        // set up an option for all current terms
        if(currentTerms.length > 0) {
            // create special term for all current terms
            $scope.terms.unshift({ id: -1, name: 'All Current Terms', });
            currentTermsLookup = _.indexBy(currentTerms, 'id');
        }

        // select a term
        $scope.selectedTerm = $scope.terms[0];
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

    $scope.selectTerm = function(term) {
        $scope.selectedTerm = term;

        var sectionsForTermFilter = null;
        if(term.id === -1) {
            // all current terms
            sectionsForTermFilter = function(elem) { return _.has(currentTermsLookup, elem.term); };
        }
        else {
            sectionsForTermFilter = function(elem) { return elem.term === term.id; };
        }
        $scope.termSections = _.filter($scope.sections, sectionsForTermFilter);
    };

    $scope.selectTerm($scope.selectedTerm);

    // create teacher lookup
    $scope.teachers = _.indexBy(userData.sprout_users, 'pk');

    // define structure for editing student fields
    $scope.editing = false;
    $scope.studentProperties = {
        first_name: {
            key: 'first_name',
            title: 'First Name',
            value: $scope.student.first_name,
            curValue: $scope.student.first_name,
        },
        last_name: {
            key: 'last_name',
            title: 'Last Name',
            value: $scope.student.last_name,
            curValue: $scope.student.last_name,
        },
        student_id: {
            key: 'student_id',
            title: 'Student ID',
            value: $scope.student.student_id,
            curValue: $scope.student.student_id,
        },
        birthdate: {
            key: 'birthdate',
            title: 'Birthday',
            value: moment($scope.student.birthdate).format('YYYY-MM-DD'),
            curValue: moment($scope.student.birthdate).format('YYYY-MM-DD'),
        },
        grade_level: {
            key: 'grade_level',
            title: 'Grade Level',
            value: $scope.student.grade_level,
            curValue: $scope.student.grade_level,
        },
    };

    // toggles whether or not you're editing the student
    $scope.toggleEdit = function(value) {
        $scope.editing = value;

        if(!value) {
            _.each($scope.studentProperties, function(value, key) {
                if(value.key === 'birthdate') {
                    value.curValue = moment(value.value);
                }
                else {
                    value.curValue = value.value;
                }
            });
        }
    };

    /**
     * Saves a student. Only saves the property that was confirmed.
     *
     * @param {object} property - property from studentProperties to save.
     */
    $scope.saveStudent = function() {
        var newStudent = {};
        _.each($scope.studentProperties, function(value, key) {
            newStudent[key] = value.curValue;
        });

        newStudent.birthdate = moment(newStudent.birthdate).format('YYYY-MM-DD').toString();

        studentService.updateStudent($scope.student.id, newStudent).then(
            function success(data) {
                _.each($scope.studentProperties, function(value, key) {
                    if(value.key === 'birthdate') {
                        value.value = moment(data.student[key]).format('YYYY-MM-DD');
                        value.curValue = moment(data.student[key]).format('YYYY-MM-DD');
                    }
                    else {
                        value.value = data.student[key];
                        value.curValue = data.student[key];
                    }
                });
                $scope.student = data.student;

                if($scope.editing) {
                    $scope.toggleEdit(false);
                }
            },
            function error(response) {
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
    
    // parent contact info
    
    function resetNewParentContactInfo() {
        $scope.newParentContactInfo = {};
        var keys = _.keys($scope.parentContactInfoProperties);
        _.each(keys, function(key) {
            $scope.newParentContactInfo[key] = '';
        });
    }

    function prepareParentContactInfo(elem) {
        var keys = _.keys($scope.parentContactInfoProperties);
        _.each(keys, function(key) {
            elem[key + '_temp'] = elem[key];
        });
        elem.editing = false;
    }

    function copyParentContactInfo(elem, updating) {
        var newElem = {};
        var keys = _.keys($scope.parentContactInfoProperties);
        _.each(keys, function(key) {
            if(updating) {
                newElem[key] = elem[key + '_temp'];
            }
            else {
                newElem[key] = elem[key];
            }
        });
        return newElem;
    }


    $scope.parentContactInfoProperties = {
        first_name: {
            key: 'first_name',
            title: 'First Name',
            required: true,
            type: 'text',
        },
        last_name: {
            key: 'last_name',
            title: 'Last Name',
            required: true,
            type: 'text',
        },
        phone: {
            key: 'phone',
            title: 'Phone Number',
            required: false,
            type: 'text',
        },
        email: {
            key: 'email',
            title: 'Email',
            required: false,
            type: 'email',
        },
        relationship: {
            key: 'relationship',
            title: 'Relationship to Student',
            required: false,
            type: 'text',
        },
        preferred_method_of_contact: {
            key: 'preferred_method_of_contact',
            title: 'Preferred Method',
            required: false,
            type: 'select',
            options: 'option as option for option in parentContactInfoSelectOptions',
        },
        preferred_time: {
            key: 'preferred_time',
            title: 'Preferred Time',
            required: false,
            type: 'text',
        },
    };
    $scope.parentContactInfoSelectOptions = ['N/A', 'Phone', 'Email', ];
    $scope.addingParentContactInfo = false;

    $scope.parentContactInfo = parentContactData.parent_contact_infos;
    _.each($scope.parentContactInfo, function(elem) { prepareParentContactInfo(elem); });

    $scope.toggleAddParentContactInfo = function(value) {
        $scope.addingParentContactInfo = value;
        if(!value) {
            resetNewParentContactInfo();
        }
    };

    $scope.toggleEditParentContactInfo = function(entry, value) {
        entry.editing = value;
        if(!value) {
            prepareParentContactInfo(entry);
        }
    };

    $scope.addParentContactInfo = function() {
        var newEntry = copyParentContactInfo($scope.newParentContactInfo);
        newEntry.student = $scope.student.id;

        studentService.addParentContactInfoForStudent($scope.student.id, newEntry).then(
            function success(data) {
                var preparedEntry = data.parent_contact_info;
                prepareParentContactInfo(preparedEntry);
                $scope.parentContactInfo.push(preparedEntry);
                $scope.toggleAddParentContactInfo(false);
            },
            function error(response) {
                toastService.error('The server wasn\'t able to save the new contact info.');
            }
        );
    };

    $scope.saveParentContactInfo = function(entry) {
        var newEntry = copyParentContactInfo(entry, true);

        newEntry.id      = entry.id;
        newEntry.student = $scope.student.id;

        studentService.updateParentContactInfoForStudent($scope.student.id, newEntry.id, newEntry).then(
            function success(data) {
                var keys = _.keys($scope.parentContactInfoProperties);
                _.each(keys, function(key) {
                    entry[key] = newEntry[key];
                });
                $scope.toggleEditParentContactInfo(entry, false);
            },
            function error(response) {
                var moreInfo = '';
                if(response.data['email']) {
                    moreInfo = 'Please enter a valid email address.';
                }
                toastService.error('The server wasn\'t able to save the new contact info. ' + moreInfo);
            }
        );
    };

    $scope.deleteParentContactInfo = function(entry) {
        studentService.deleteParentContactInfoForStudent($scope.student.id, entry.id).then(
            function success(data) {
                var index = _.findIndex($scope.parentContactInfo, function(elem) { return elem.id === entry.id; });
                if(index !== -1) {
                    $scope.parentContactInfo.splice(index, 1);
                }
            },
            function error(response) {
                toastService.error('The server wasn\'t able to delete the contact info.');
            }
        );
    };


    resetNewParentContactInfo();

    /*** IMAGE RELATED ***/

    $scope.uploadStudentImage = function(image) {
        studentService.addStudentPicture($scope.student.id, { file: image, }).then(
            function success(data) {
                $rootScope.currentStudent.id = $scope.student.id;
                $rootScope.currentStudent.picture = data.profile_picture.file;

                $scope.student.picture = data.profile_picture.id;

                $scope.closeModal();
            },
            function error(response) {
                toastService.error('The server wasn\'t able to save your image.');
            }
        );
    };

    $scope.deleteStudentImage = function() {
        if($scope.student.picture === null) {
            return;
        }

        studentService.deleteStudentPicture($scope.student.id, $scope.student.picture).then(
            function success(data) {
                $rootScope.currentStudent.id = $scope.student.id;
                $rootScope.currentStudent.picture = null;

                $scope.student.picture = null;
            },
            function error(response) {
                toastService.error('The server wasn\'t able to delete your image.');
            }
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

