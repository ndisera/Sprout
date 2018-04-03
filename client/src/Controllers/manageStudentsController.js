app.controller("manageStudentsController", function($scope, $rootScope, $location, toastService, students, studentService) {
    $scope.location = $location;

    var studentTask = "view/edit";
    $scope.displayStudentViewSearch = true;
    $scope.displayStudentForm = false;
    $scope.studentD = {};
    $scope.newStudent = {};
    $scope.studentInfo = studentService.studentInfo;
    $scope.gradeLevels = ["K", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    /**
     * Returns the display value for a student's grade level
     * @param {number} grade - grade level.
     */
    $scope.displayGrade = function(grade) {
        if (grade === 0) {
            return "K";
        }
        return grade;
    }

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
            case "add":
                $scope.displayStudentForm = false;
                break;
            default:
        }
        // set to new task
        studentTask = task;
        switch (task) {
            case "view/edit":
                $scope.displayStudentViewSearch = true;
                break;
            case "add":
                $scope.displayStudentForm = true;
                break;
            default:
        }
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
        if ($scope.newStudent.grade_level === "K") {
            $scope.newStudent.grade_level = 0;
        }
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
     * Deletes the selected student from the database.
     */
    $scope.deleteStudent = function() {
        var studentPromise = studentService.deleteStudent($scope.studentD.id);
        studentPromise.then(function success(data) {
            $scope.studentD = {};
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to delete the student." + errorResponse());
        });
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
