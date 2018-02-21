app.controller("manageCasesController", function ($scope, $rootScope, $location, students, userData, studentService, userService) {
    /**
     * Grabs all case managers with students.
     */
    function getCaseManagers() {
        var getCaseManagersPromise = studentService.getStudents({
            include: ['case_manager.*']
        });
        getCaseManagersPromise.then(function success(data) {
            var caseStudents = _.reject(data.students, function(student){ return student.case_manager == null; });
            var otherStudents = _.filter(data.students, function(student) {return student.case_manager == null; });

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
        }, function error(response) {
            $scope.errorMessage = response;
        });
    };

    getCaseManagers();

    // remove student (update student object case manager field)
    // update student (update student object case manager field)
    // remove case manager - or kind of like a cancel all (update all student objects case manager fields (for that case manager))
    // delete case manager (delete user)
})
