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
                elem.addingNote = false;
                elem.due_date = moment(elem.due_date);
                elem.due_date_temp = moment(elem.due_date);
                elem.title_temp = elem.title;
                resetNewData(elem);
                resetNewNote(elem);
            });
        }
    }

    $scope.selectIep = function(iep) {
        $scope.selectedIep = iep;
    }

    function resetNewData(iep) {
        iep.newData = {
            date: moment().format('YYYY-MM-DD'),
            goal: iep.id,
            note: '',
            value: 0,
        };
    }

    function resetNewNote(iep) {
        iep.newNote = {
            date: moment().format('YYYY-MM-DD'),
            goal: iep.id,
            title: '',
            note: '',
        };
    }

    $scope.noteValidation = function(note) {
        if(note.date_temp === null || note.date_temp === undefined || note.date_temp === '') {
            return true;
        }
        if(note.title_temp === null || note.title_temp === undefined || note.title_temp === '') {
            return true;
        }
        if(note.body_temp === null || note.body_temp === undefined || note.body_temp === '') {
            return true;
        }
        return false;
    }

    $scope.dataValidation = function(iep, data) {
        if(data.date_temp === null || data.date_temp === undefined || data.date_temp === '') {
            return true;
        }
        return $scope.dataValueValidation(iep, data);
    }

    $scope.dataValueValidation = function(iep, data) {
        if(iep.quantitative) {
            if(data.value_temp === null || data.value_temp === undefined || data.value_temp === '') {
                return true;
            }
            var val = parseInt(data.value_temp);
            if(val === NaN || val < iep.quantitative_range_low || val > iep.quantitative_range_upper) {
                return true;
            }
        }
        return false;
    }

    $scope.dataNewValueValidation = function(iep, data) {
        if(iep.quantitative) {
            if(data.value === null || data.value === undefined || data.value === '') {
                return true;
            }
            var val = parseInt(data.value);
            if(val === NaN || val < iep.quantitative_range_low || val > iep.quantitative_range_upper) {
                return true;
            }
        }
        return false;
    }

    $scope.toggleEditIep = function(iep, value) {
        iep.editing = value;
        if(!iep.editing) {
            iep.title_temp = iep.title;
            iep.due_date_temp = iep.due_date;
        }
    };

    $scope.toggleEditData = function(data, value) {
        data.editing = value;
        if(!data.editing) {
            data.date_temp = data.date;
            data.value_temp = data.value;
            data.note_temp = data.note;
        }
    };

    $scope.toggleEditNote = function(note, value) {
        note.editing = value;
        if(!note.editing) {
            note.date_temp = note.date;
            note.title_temp = note.title;
            note.body_temp = note.body;
        }
    };

    $scope.toggleAddData = function(iep, value) {
        iep.addingData = value;
        if(!iep.addingData) {
            resetNewData(iep);
        }
    };

    $scope.toggleAddNote = function(iep, value) {
        iep.addingNote = value;
        if(!iep.addingNote) {
            resetNewNote(iep);
        }
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
                                e.value_temp = e.value;
                                e.note_temp = e.note;
                                e.editing = false;
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
                                e.date_temp = moment(e.date);
                                e.title_temp = e.title;
                                e.body_temp = e.body;
                                e.editing = false;
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
