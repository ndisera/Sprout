app.controller("manageCasesController", function($scope, $rootScope, $location, students, userData, studentService, userService) {

    getCaseManagers();
    $scope.test = {};
    $scope.toggle = {};

    $scope.togglePanelBodies = function(index) {
        if (!_.has($scope.toggle, index || $scope.toggle[index] == null)) {
            $scope.toggle[index] = true;
        }
    }

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
            $scope.nonManagers = _.indexBy(userData.sprout_users, 'pk');
            for (var teacher in $scope.caseManagers) {
                delete $scope.nonManagers[teacher];
            }

            refreshManagerArrays();
            refreshStudentArray();
        }, function error(response) {
            $scope.errorMessage = response;
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
    }

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
    }

    /**
     * Filter used for viewing unassigned students
     * @param {student} student - student to be filtered.
     */
    $scope.otherStudentFilter = function(student) {
        if ($scope.test == null) {
            return true;
        }
        var input = $scope.test.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if (student.first_name.toUpperCase().includes(input) || student.last_name.toUpperCase().includes(input) ||
            student.student_id.toUpperCase().includes(input) || fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }

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

    // remove student (update student object case manager field)
    // update student (update student object case manager field)
    // remove case manager - or kind of like a cancel all (update all student objects case manager fields (for that case manager))
    // delete case manager (delete user)
})

app.filter('otherStudentFilter', [function() {
    return function(students, index, test) {
        if (!_.has(test, index) || test[index] == null) {
            return students;
        }
        var filtered = [];
        var input = test[index].toUpperCase();
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
