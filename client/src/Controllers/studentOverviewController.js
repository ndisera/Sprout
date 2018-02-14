app.controller("studentOverviewController", function ($scope, $rootScope, $routeParams, studentService, caseManagerService, enrollmentData, caseManagerData, teacherData, studentData) {

    // set important scope variables
    $scope.student     = studentData.student;
    $scope.enrollments = [];
    $scope.sections    = [];

    if(enrollmentData.enrollments !== null && enrollmentData.enrollments !== undefined) {
        $scope.enrollments = enrollmentData.enrollments;
    }
    if(enrollmentData.sections !== null && enrollmentData.sections !== undefined) {
        $scope.sections = enrollmentData.sections;
    }

    // create class schedule
    $scope.teachers = _.indexBy(enrollmentData.teachers, 'id');

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
                //TODO: notify the user
            }
        );

    };

    // hard coded case managers for now
    var teacherLookup = _.indexBy(teacherData.teachers, 'id');
    if(caseManagerData.case_managers.length > 0) {
        // student has case manager
        $scope.caseManagerRecordId = caseManagerData.case_managers[0].id;

        var caseManagerId = caseManagerData.case_managers[0].teacher;
        $scope.caseManager = teacherLookup[caseManagerId];
    }
    else {
        $scope.caseManagerRecordId = null;

        // student does not yet have case manager
        $scope.caseManager = {
            id: null,
            first_name: 'NO CASE',
            last_name: 'MANAGER',
        };
    }

    $scope.caseManagers = _.clone(teacherData.teachers);

    $scope.selectCaseManager = function(caseManager) {
        if($scope.caseManagerRecordId === null) {
            // add new case manager record
            var newCaseManagerRecord = {
                student: $scope.student.id,
                teacher: caseManager.id,
            };

            caseManagerService.assignCaseManager(newCaseManagerRecord).then(
                function success(data) {
                    $scope.caseManagerRecordId = data.case_manager.id;
                    $scope.caseManager = teacherLookup[data.case_manager.teacher];
                },
                function error(response) {
                    //TODO: notify the user
                }
            );
        }
        else {
            // edit existing case manager record
            var newCaseManagerRecord = {
                student: $scope.student.id,
                teacher: caseManager.id,
                id: $scope.caseManagerRecordId,
            };

            caseManagerService.updateCaseManager($scope.caseManagerRecordId, newCaseManagerRecord).then(
                function success(data) {
                    $scope.caseManagerRecordId = data.case_manager.id;
                    $scope.caseManager = teacherLookup[data.case_manager.teacher];
                },
                function error(response) {
                    //TODO: notify the user
                }
            );
        }
    };

});







