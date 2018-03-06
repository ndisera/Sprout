app.controller("manageStudentsController", function($scope, $rootScope, $location, toastService, students, studentService) {
    $scope.location = $location;

    var studentTask = "view/edit";
    $scope.displayStudentViewSearch = true;
    $scope.displayStudentDeleteSearch = false;
    $scope.displayStudentForm = false;
    $scope.addStudentSuccess = false;
    $scope.deleteStudentSuccess = false;
    $scope.studentD = {};
    $scope.newStudent = {};
    $scope.studentInfo = studentService.studentInfo;

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
     * Display search or form depending on the student task selected and set the active button
     * @param {string} task - the type of task selected.
     */
    $scope.changeStudentTask = function(task) {
        switch (studentTask) {
            case "view/edit":
                $scope.displayStudentViewSearch = false;
                break;
            case "delete":
                $scope.displayStudentDeleteSearch = false;
                $scope.deleteStudentSuccess = false;
                $scope.deleteStudentFailure = false;
                break;
            case "add":
                $scope.displayStudentForm = false;
                $scope.addStudentSuccess = false;
                $scope.addStudentFailure = false;
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
                $scope.displayStudentDeleteSearch = true;
                break;
            case "add":
                $scope.displayStudentForm = true;
                break;
            default:
        }
        // remove or set active property
        setActiveButton(task);
    };

    /**
     * Navigates to student's page if name in navigation search bar is valid.
     */
    $scope.viewStudent = function(id) {
        $location.path('/student/' + id);
    };

    /**
     * Creates and adds a new student.
     */
    $scope.addStudent = function() {
        $scope.newStudent.birthdate = moment($scope.newStudent.birthdate).format('YYYY-MM-DD').toString();
        var studentPromise = studentService.addStudent($scope.newStudent);
        studentPromise.then(function success(data) {
            $scope.newStudent = {};
            toastService.success("New student has been added.")
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to add the student." + errorResponse());
        });
    };

    /**
     * Hides the delete student search bar and displays their info with an option to delete.
     */
    $scope.displayDeleteStudent = function(student) {
        $scope.studentD = student;
        $scope.studentDeleteSearch = student.first_name + ' ' + student.last_name;
    };

    /**
     * Sets studentD
     * @param {student} student - student used to set.
     */
    $scope.setStudentD = function(student) {
        $scope.studentD = student;
        $("#deleteStudentModal").modal();
    };

    /**
     * Filter used for viewing students
     * @param {student} student - student to be filtered.
     */
    $scope.viewStudentFilter = function(student) {
        if ($scope.studentViewSearch == null) {
            return true;
        }
        var input = $scope.studentViewSearch.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if (student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || student.birthdate.toUpperCase().includes(input) ||
            fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }

    /**
     * Filter used for deleting students
     * @param {student} student - student to be filtered.
     */
    $scope.deleteStudentFilter = function(student) {
        if ($scope.studentDeleteSearch == null) {
            return true;
        }
        var input = $scope.studentDeleteSearch.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if (student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || student.birthdate.toUpperCase().includes(input) ||
            fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }

    /**
     * Deletes the selected student from the database.
     */
    $scope.deleteStudent = function() {
        var studentPromise = studentService.deleteStudent($scope.studentD.id);
        studentPromise.then(function success(data) {
            $scope.studentD = {};
            //$scope.displayStudentDeleteSearch = true;
            $scope.studentDeleteSearch = "";
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to delete the student." + errorResponse());
        });
    };

    /**
     * Leaves the most recently selected button active and removes the active class from the other buttons
     * @param {string} task - the type of task selected.
     */
    function setActiveButton(task) {
        if (task === 'view/edit') {
            document.getElementById('sViewButton').classList.add('active');
            document.getElementById('sViewButton2').classList.add('active');
        } else {
            document.getElementById('sViewButton').classList.remove('active');
            document.getElementById('sViewButton2').classList.remove('active');
        }
        if (task === 'add') {
            document.getElementById('sAddButton').classList.add('active');
            document.getElementById('sAddButton2').classList.add('active');
        } else {
            document.getElementById('sAddButton').classList.remove('active');
            document.getElementById('sAddButton2').classList.remove('active');
        }
        if (task === 'delete') {
            document.getElementById('sDeleteButton').classList.add('active');
            document.getElementById('sDeleteButton2').classList.add('active');
        } else {
            document.getElementById('sDeleteButton').classList.remove('active');
            document.getElementById('sDeleteButton2').classList.remove('active');
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
});
