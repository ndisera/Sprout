app.controller("studentOverviewController", function ($scope, $rootScope, $http, $routeParams, studentService, behaviorService, sectionService, enrollmentData, studentData) {

    // set important scope variables
    $scope.student = studentData.student;
    $scope.enrollments = enrollmentData.enrollments;
    $scope.sections = enrollmentData.sections;

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
            value: $scope.student.birthdate,
            curValue: $scope.student.birthdate,
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
        newStudent[property.key] = property.curValue;

        studentService.updateStudent($scope.student.id, newStudent).then(
            function success(data) {
                _.each($scope.studentProperties, function(value, key) {
                    value.value = data.student[key];
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
    $scope.caseManager = "John Doe";
    $scope.caseManagers = ["John Doe", "Jane Doe", "Mr. Exampleman", "Yo There"]

    $scope.selectCaseManager = function(caseManager) {
        console.log(caseManager);
        $scope.caseManager = caseManager;
    };

});