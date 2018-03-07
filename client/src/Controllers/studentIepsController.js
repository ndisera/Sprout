app.controller("studentIepsController", function($scope, $rootScope, $location, $routeParams, studentService, student, ieps) {
    $scope.location = $location;
    $scope.student = student.student;

    $scope.ieps        = [];
    $scope.selectedIep = {};

    if(ieps !== null && ieps !== undefined) {
        if(ieps.iep_goals !== null && ieps.iep_goals !== undefined) {
            $scope.ieps = ieps.iep_goals;
            _.each($scope.ieps, function(elem) {
                elem.editing = false;
                elem.addingData = false;
                elem.due_date = moment(elem.due_date);
                elem.due_date_temp = moment(elem.due_date);
                elem.newData = {
                    date: moment().format('YYYY-MM-DD'),
                    goal: elem.id,
                    note: '',
                    value: 0,
                };
                elem.newNote = {
                    date: moment().format('YYYY-MM-DD'),
                    goal: elem.id,
                    title: '',
                    note: '',
                };
            });
        }
    }

    $scope.toggleAddData = function(iep, value) {
        iep.addingData = value;
    };

    $scope.toggleAddNote = function(iep, value) {
        iep.addingNote = value;
    };

    $scope.updateIeps = function() {
        _.each($scope.ieps, function(elem) {
            studentService.getIepDatasForStudent($scope.student.id, elem.id).then(
                function success(data) {
                    if(data !== null && data !== undefined) {
                        if(data.iep_goal_datapoints !== null && data.iep_goal_datapoints !== undefined) {
                            elem.datapoints = data.iep_goal_datapoints;
                            _.each(elem.datapoints, function(e) {
                                e.date = moment(e.date);
                                e.date_temp = moment(e.date);
                            });
                            console.log(data.iep_goal_datapoints);
                        }
                    }
                },
                function error(response) {

                },
            );

            studentService.getIepNotesForStudent($scope.student.id, elem.id).then(
                function success(data) {
                    if(data !== null && data !== undefined) {
                        if(data.iep_goal_notes !== null && data.iep_goal_notes !== undefined) {
                            elem.notes = data.iep_goal_notes;
                            _.each(elem.notes, function(e) {
                                e.date = moment(e.date);
                            });
                            console.log(data.iep_goal_notes);
                        }
                    }
                },
                function error(response) {

                },
            );

        });


    }

    $scope.updateIeps();

    $scope.selectedIep = $scope.ieps[0];

    console.log(ieps);





});
