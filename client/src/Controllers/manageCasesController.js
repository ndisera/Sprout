app.controller("manageCasesController", function($scope, $rootScope, $location, toastService, students, userData, studentService, userService) {

    getCaseManagers();
    $scope.studentSearch = {};
    $scope.caseStudentSearch = {};
    $scope.toggleStudents = {};
    $scope.toggleManagers = {};
    $scope.editCaseManagers = false;
    $scope.allManagersArray = userData.sprout_users;
    $scope.allManagers = _.indexBy($scope.allManagersArray, "pk");

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

    $scope.toggleManagerAssign = function(index) {
        if ($("#assignManagerButton" + index).text().trim() === "Assign") {
            $("#assignManagerButton" + index).html('Cancel');
        } else {
            $("#assignManagerButton" + index).html('Assign')
        }
    };

    /**
     * If a panel body hasn't been opened before in unassigned managers, load its content.
     * @param {number} index - index of panel to be opened (from ng-repeat).
     */
    $scope.togglePanelBodies = function(index) {
        if (!_.has($scope.toggleStudents, index) || $scope.toggleStudents[index] == null) {
            $scope.toggleStudents[index] = true;
        }
    };

    /**
     * If a reassign dropdown hasn't been opened before, load it's content.
     * @param {number} index - index of dropdown to be opened (from ng-repeat).
     */
    $scope.toggleDropdowns = function(index) {
        if (!_.has($scope.toggleManagers, index) || $scope.toggleManagers[index] == null) {
            $scope.toggleManagers[index] = true;
        }
    };

    /**
     * Grabs all case managers with students.
     */
    function getCaseManagers() {
        var getCaseManagersPromise = studentService.getStudents({
            include: ['case_manager.*']
        });
        getCaseManagersPromise.then(function success(data) {
            var caseStudents = _.reject(data.students, function(student) {
                return student.case_manager == null;
            });
            var otherStudents = _.filter(data.students, function(student) {
                return student.case_manager == null;
            });

            // students grouped by case manager (key is user id)
            $scope.caseStudents = _.groupBy(caseStudents, 'case_manager');

            // students that haven't been assigned (key is student id)
            $scope.otherStudents = _.indexBy(otherStudents, 'id');

            // all teachers assigned to at least one student
            $scope.caseManagers = _.indexBy(data.sprout_users, 'pk');

            // setNonManagers to all other managers
            $scope.nonManagers = _.indexBy($scope.allManagersArray, 'pk');
            for (var teacher in $scope.caseManagers) {
                delete $scope.nonManagers[teacher];
            }

            refreshManagerArrays();
            refreshStudentArray();
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to get assigned case managers." + errorResponse());
        });
    };

    /**
     * Filter used for viewing assigned managers
     * @param {user} manager - manager to be filtered.
     */
    $scope.caseManagerFilter = function(manager) {
        if ($scope.caseManagerSearch == null) {
            return true;
        }
        var input = $scope.caseManagerSearch.toUpperCase();
        var fullname = manager.first_name + " " + manager.last_name;
        if (manager.first_name.toUpperCase().includes(input) || manager.last_name.toUpperCase().includes(input) ||
            manager.email.toUpperCase().includes(input) || fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    };

    /**
     * Filter used for viewing unassigned managers
     * @param {user} manager - manager to be filtered.
     */
    $scope.nonManagerFilter = function(manager) {
        if ($scope.nonManagerSearch == null) {
            return true;
        }
        var input = $scope.nonManagerSearch.toUpperCase();
        var fullname = manager.first_name + " " + manager.last_name;
        if (manager.first_name.toUpperCase().includes(input) || manager.last_name.toUpperCase().includes(input) ||
            manager.email.toUpperCase().includes(input) || fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    };

    /**
     * Filter used for viewing unassigned students
     * @param {student} student - student to be filtered.
     */
    $scope.otherStudentFilter = function(student) {
        if ($scope.studentSearch == null) {
            return true;
        }
        var input = $scope.studentSearch.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if (student.first_name.toUpperCase().includes(input) || student.last_name.toUpperCase().includes(input) ||
            student.student_id.toUpperCase().includes(input) || fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    };

    /**
     * Sets manager arrays equal to their lookup values.
     */
    function refreshManagerArrays() {
        $scope.caseManagersArray = _.values($scope.caseManagers);
        $scope.nonManagersArray = _.values($scope.nonManagers);
    }

    /**
     * Sets student arrays equal to their lookup values.
     */
    function refreshStudentArray() {
        $scope.otherStudentsArray = _.values($scope.otherStudents);
    }

    /**
     * Unassigns a case manager, student pair.
     * @param {number} managerPK - student's previous case manager.
     * @param {student} student - student to be edited.
     */
    $scope.unassign = function(managerPK, student) {
        student.case_manager = null;
        var studentPromise = studentService.updateStudent(student.id, student);
        studentPromise.then(function success(data) {
            $scope.otherStudents[student.id] = data.student;
            refreshStudentArray();
            // Think this is by reference here which is what I want
            unassignStudent(managerPK, data);
            // stop editing if there's nothing left to edit
            checkEdit();
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to unassign the student from their case manager." + errorResponse());
        });
    };

    /**
     * Assigns a student to a different case manager.
     * @param {number} oldManagerPK - student's previous case manager.
     * @param {number} newManagerPK - student's new case manager.
     * @param {student} student - student to be edited.
     */
    $scope.reassign = function(oldManagerPK, newManagerPK, student) {
        student.case_manager = newManagerPK;
        var studentPromise = studentService.updateStudent(student.id, student);
        studentPromise.then(function success(data) {
            unassignStudent(oldManagerPK, data);
            // new manager stuff
            if (!_.has($scope.caseManagers, newManagerPK)) {
                delete $scope.nonManagers[newManagerPK];
                $scope.caseManagers[newManagerPK] = $scope.allManagers[newManagerPK];
            }
            $scope.caseStudents[newManagerPK] = [];
            $scope.caseStudents[newManagerPK].push(data.student);
            refreshManagerArrays();
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to reassign the student to a different case manager." + errorResponse());
        });
    };

    /**
     * Assigns a student with no case manager to a case manager.
     * @param {number} managerPK - case manager being assigned.
     * @param {student} student - student being assigned.
     * @param {string} assigned - "assigned" if manager has students, "unassigned" if not.
     */
    $scope.assignManagerAndStudent = function(managerPK, student, assigned) {
        student.case_manager = managerPK;
        var studentPromise = studentService.updateStudent(student.id, student);
        studentPromise.then(function success(data) {
            // already assigned vs not assigned
            delete $scope.otherStudents[data.student.id];
            if (assigned === "assigned") {
                $scope.caseStudents[managerPK].push(data.student);
            } else if (assigned === "unassigned") {
                // move manager
                delete $scope.nonManagers[managerPK];
                $scope.caseManagers[managerPK] = $scope.allManagers[managerPK];
                refreshManagerArrays();
                // move student and assign to him
                $scope.caseStudents[managerPK] = [];
                $scope.caseStudents[managerPK].push(data.student);
            }
            refreshStudentArray();
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to assign the student to the case manager." + errorResponse());
        });
    }

    /**
     * Helper function that unassigns a manager.
     * @param {number} managerPK - manager being unassigned.
     */
    function unassignManager(managerPK) {
        delete $scope.caseStudents[managerPK];
        delete $scope.caseManagers[managerPK];
        // and now add this manager to othermanagers
        $scope.nonManagers[managerPK] = $scope.allManagers[managerPK];
        refreshManagerArrays();
    }

    /**
     * Helper function that unassigns a student.
     * @param {number} managerPK - previous manager.
     * @param {reponse.data} data - data from student update promise.
     */
    function unassignStudent(managerPK, data) {
        // Think this is by reference here which is what I want
        var managerArray = $scope.caseStudents[managerPK];
        if (managerArray.length > 1) {
            for (var i = 0; i < managerArray.length; i++) {
                if (managerArray[i].id === data.student.id) {
                    managerArray.splice(i, i + 1);
                    return;
                }
            }
        } else {
            unassignManager(managerPK);
        }
    }

    /**
     * Switches stop button to edit if there's nothing left to edit.
     */
    function checkEdit() {
        // stop editing if there's nothing left to edit
        if ($scope.nonManagersArray.length === $scope.allManagersArray.length) {
            $scope.editCaseManagers = false;
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

// filter used for unassigned students
app.filter('otherStudentFilter', [function() {
    return function(students, index, studentSearch) {
        if (!_.has(studentSearch, index) || studentSearch[index] == null) {
            return students;
        }
        var filtered = [];
        var input = studentSearch[index].toUpperCase();
        for (var i = 0; i < students.length; i++) {
            var student = students[i];
            var fullname = student.first_name + " " + student.last_name;
            if (student.first_name.toUpperCase().includes(input) || student.last_name.toUpperCase().includes(input) ||
                student.student_id.toUpperCase().includes(input) || fullname.toUpperCase().includes(input)) {
                filtered.push(student);
            }
        }
        return filtered;
    }
}]);
