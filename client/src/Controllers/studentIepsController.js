app.controller("studentIepsController", function($scope, $rootScope, $location, $routeParams, toastService, studentService, student, ieps) {
    $scope.location = $location;
    $scope.student = student.student;

    $scope.ieps        = [];
    $scope.selectedIep = {};
    $scope.newIep      = {};
    $scope.addingIep   = false;

    resetNewIep();

    if(ieps !== null && ieps !== undefined) {
        if(ieps.iep_goals !== null && ieps.iep_goals !== undefined) {
            $scope.ieps = ieps.iep_goals;
            _.each($scope.ieps, function(elem) {
                elem.editing                  = false;
                elem.addingData               = false;
                elem.addingNote               = false;
                elem.due_date                 = moment(elem.due_date);
                elem.due_date_temp            = moment(elem.due_date);
                elem.title_temp               = elem.title;
                elem.quantitative_target_temp = elem.quantitative_target;
                resetNewData(elem);
                resetNewNote(elem);
            });
        }
    }

    $scope.selectIep = function(iep) {
        if($scope.selectedIep === $scope.newIep) {
            resetNewIep();
        }
        $scope.selectedIep = iep;
        if(iep.id !== undefined && iep.id !== null) {
            $scope.updateIep(iep);
        }
    }

    /**
     * helper functions for resetting "Add" forms.
     * resets new iep, data, and note objects.
     */
    function resetNewIep() {
        $scope.newIep = {
            due_date: moment().add(1, 'y'),
            quantitative: 'No',
            quantitative_category: null,
            quantitative_range_low: 0,
            quantitative_range_upper: 100,
            quantitative_target: null,
            title: 'New Goal',
            student: $scope.student.id,
        };
    }

    function resetNewData(iep) {
        iep.newData = {
            date: moment(),
            goal: iep.id,
            note: '',
            value: 0,
        };
    }

    function resetNewNote(iep) {
        iep.newNote = {
            goal: iep.id,
            title: '',
            note: '',
        };
    }

    $scope.iepRangeValidation = function() {
        if($scope.newIep.quantitative === 'Yes') {
            if($scope.newIep.quantitative_range_low === null || $scope.newIep.quantitative_range_low === undefined || $scope.newIep.quantitative_range_low === '') {
                return true;
            }
            if($scope.newIep.quantitative_range_upper === null || $scope.newIep.quantitative_range_upper === undefined || $scope.newIep.quantitative_range_upper === '') {
                return true;
            }
            var low = parseInt($scope.newIep.quantitative_range_low);
            var upper = parseInt($scope.newIep.quantitative_range_upper);
            if(low === NaN || upper === NaN || low >= upper) {
                return true;
            }

            if($scope.newIep.quantitative_target === null || $scope.newIep.quantitative_target === undefined || $scope.newIep.quantitative_target === '') {
                return false;
            }

            var target = parseInt($scope.newIep.quantitative_target);
            if(target < low || target > upper) {
                return true;
            }
        }
        return false;
    };

    $scope.noteValidation = function(note) {
        if(note.title_temp === null || note.title_temp === undefined || note.title_temp === '') {
            return true;
        }
        if(note.body_temp === null || note.body_temp === undefined || note.body_temp === '') {
            return true;
        }
        return false;
    };

    $scope.dataValidation = function(iep, data) {
        if(data.date_temp === null || data.date_temp === undefined || data.date_temp === '') {
            return true;
        }
        return $scope.dataValueValidation(iep, data);
    };

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
    };

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
    };

    $scope.toggleEditIep = function(iep, value) {
        iep.editing = value;
        if(!iep.editing) {
            iep.title_temp               = iep.title;
            iep.due_date_temp            = iep.due_date;
            iep.quantitative_target_temp = iep.quantitative_target;
        }
    };

    $scope.toggleAddIep = function(value) {
        $scope.addingIep = value;
        if(value) {
            $scope.selectIep($scope.newIep);
        }
        else {
            resetNewIep();
            if($scope.ieps.length > 0) {
                $scope.selectIep($scope.ieps[0]);
            }
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

    $scope.updateIep = function(iep) {
        var config = {
            sort: ['date', ],
        };

        studentService.getIepDatasForStudent($scope.student.id, iep.id, config).then(
            function success(data) {
                if(data !== null && data !== undefined) {
                    if(data.iep_goal_datapoints !== null && data.iep_goal_datapoints !== undefined) {
                        iep.datapoints = data.iep_goal_datapoints;
                        _.each(iep.datapoints, function(e) {
                            e.date = moment(e.date);
                            e.date_temp = moment(e.date);
                            e.value_temp = e.value;
                            e.note_temp = e.note;
                            e.editing = false;
                        });
                        iep.datapoints = _.sortBy(iep.datapoints, 'date');

                        var borderColor = $rootScope.colors[iep.id % $rootScope.colors.length].setAlpha(0.7).toRgbString();
                        var pointBackgroundColor = $rootScope.colors[iep.id % $rootScope.colors.length].setAlpha(0.7).toRgbString();
                        var backgroundColor = $rootScope.colors[iep.id % $rootScope.colors.length].setAlpha(0.2).toRgbString();

                        iep.graph = {
                            labels: [],
                            series: ['Progress', 'Goal', ],
                            data: [[], [], ],
                            options: {
                                elements: {
                                    line: {
                                        fill: true,
                                    },
                                },
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    yAxes: [
                                        {
                                            display: true,
                                            ticks: {
                                                min: iep.quantitative_range_low,
                                                max: iep.quantitative_range_upper,
                                            },
                                        },
                                    ],
                                },
                                spanGaps: true,
                                legend: {
                                    display: false,
                                }
                            },
                            datasetOverride: [
                                {
                                },
                                {
                                    fill: false,
                                    borderDash: [ 10, 5, ],
                                },
                            ],
                            colors: [
                                {
                                    borderColor: borderColor,
                                    pointBackgroundColor: pointBackgroundColor,
                                    backgroundColor: backgroundColor,
                                },
                                {
                                    borderColor: $rootScope.colors[0].setAlpha(1).toRgbString(),
                                    pointBackgroundColor: $rootScope.colors[0].setAlpha(0.7).toRgbString(),
                                    backgroundColor: $rootScope.colors[0].setAlpha(0.2).toRgbString(),
                                },
                            ],
                        };

                        if(iep.datapoints.length === 0) {
                            iep.graph.show = false;
                        }
                        else {
                            iep.graph.show = true;

                            //iep.graph.data = [[], ];

                            // iterate through each date, setting data as necessary
                            // can take first and last because it's sorted
                            var iterDate = iep.datapoints[0].date.clone();
                            var dateDiff = iep.datapoints[iep.datapoints.length - 1].date.diff(iep.datapoints[0].date, 'd');
                            var j = 0;
                            for(var i = 0; i < dateDiff + 1; i++) {
                                iep.graph.labels[i] = iterDate.format('MM/DD').toString();
                                iep.graph.data[0][i] = null;
                                iep.graph.data[1][i] = null;

                                if(iep.datapoints[j]) {
                                    var date = moment(iep.datapoints[j].date);
                                    var average = 0;
                                    var averageCount = 0;
                                    while(date.diff(iterDate, 'd') === 0) {
                                        average += iep.datapoints[j].value;
                                        averageCount++;

                                        j++;
                                        if(j >= iep.datapoints.length) { break; }
                                        date = moment(iep.datapoints[j].date);
                                    }

                                    if(averageCount !== 0) {
                                        iep.graph.data[0][i] = average / averageCount;
                                    }
                                }
                                iterDate.add(1, 'd');
                            }
                            updateIepTarget(iep);
                        }
                    }
                }
            },
            function error(response) {
                toastService.error('The server wasn\'t able to get this IEP Goal.');
            },
        );

        studentService.getIepNotesForStudent($scope.student.id, iep.id).then(
            function success(data) {
                if(data !== null && data !== undefined) {
                    if(data.iep_goal_notes !== null && data.iep_goal_notes !== undefined) {
                        iep.notes = data.iep_goal_notes;
                        _.each(iep.notes, function(e) {
                            e.date = moment(e.date);
                            e.title_temp = e.title;
                            e.body_temp = e.body;
                            e.editing = false;
                        });
                    }
                }
            },
            function error(response) {
                toastService.error('The server wasn\'t able to get this IEP Goal.');
            },
        );
    }

    function updateIepTarget(iep) {
        iep.graph.data[1][0] = iep.quantitative_target;
        iep.graph.data[1][iep.graph.data[1].length - 1] = iep.quantitative_target;
        iep.graph.options.legend.display = (iep.quantitative_target !== null);
    }

    function copyData(data) {
        return {
            goal: data.goal,
            date: moment(data.date),
            value: data.value,
            note: data.note,
        };
    }

    function copyNote(note) {
        return {
            goal: note.goal,
            title: note.title,
            body: note.body,
        };
    }

    function copyIep(iep) {
        return {
            due_date: moment(iep.due_date),
            title: iep.title,
            student: iep.student,
            quantitative: iep.quantitative,
            quantitative_range_low: iep.quantitative_range_low,
            quantitative_range_upper: iep.quantitative_range_upper,
            quantitative_target: iep.quantitative_target,
            quantitative_category: iep.quantitative_category,
        };
    }

    $scope.addData = function(iep) {
        var toSave = copyData(iep.newData);
        if(toSave.note === undefined || toSave.note === '') {
            toSave.note = null;
        }
        else {
            toSave.note = iep.newData.note;
        }

        toSave.goal = iep.id;
        toSave.value = iep.newData.value;
        toSave.date = iep.newData.date.format('YYYY-MM-DD').toString();

        studentService.addIepDataForStudent($scope.student.id, iep.id, toSave).then(
            function success(data) {
                // take the cowards way out
                // TODO(gzuber): stitch into existing graph?
                $scope.updateIep(iep);
                if(iep.addingData) {
                    $scope.toggleAddData(iep, false);
                }
            },
            function error(response) {
                toastService.error('The server wasn\'t able to add the measurement.');
            },
        );
    }

    $scope.saveData = function(iep, data) {
        var toSave = copyData(data);
        if(toSave.note === undefined || toSave.note === '') {
            toSave.note = null;
        }
        else {
            toSave.note = data.note_temp;
        }

        toSave.date = moment(data.date_temp).format('YYYY-MM-DD').toString();
        toSave.value = data.value_temp;

        studentService.updateIepDataForStudent($scope.student.id, iep.id, data.id, toSave).then(
            function success(data) {
                $scope.updateIep(iep);

                if(data.editing) {
                    $scope.toggleEditData(data, false);
                }
            },
            function error(response) {
                toastService.error('The server wasn\'t able to save the measurement.');
            },
        );
    }

    $scope.deleteData = function(iep, data) {
        studentService.deleteIepDataForStudent($scope.student.id, iep.id, data.id).then(
            function success(data) {
                $scope.updateIep(iep);
            },
            function error(response) {
                toastService.error('The server wasn\'t able to delete the measurement.');
            },
        );
    }

    $scope.addNote = function(iep) {
        var toSave = copyNote(iep.newNote);
        
        toSave.title = iep.newNote.title;
        toSave.body = iep.newNote.body;

        studentService.addIepNoteForStudent($scope.student.id, iep.id, toSave).then(
            function success(data) {
                var newNote = data.iep_goal_note;
                newNote.date = moment(newNote.date);
                newNote.title_temp = newNote.title;
                newNote.body_temp = newNote.body;
                newNote.editing = false;

                iep.notes.push(newNote);

                if(iep.addingNote) {
                    $scope.toggleAddNote(iep, false);
                }
            },
            function error(response) {
                toastService.error('The server wasn\'t able to add the note.');
            },
        );

    }

    $scope.saveNote = function(iep, note) {
        var toSave = copyNote(note);
        
        toSave.title = note.title_temp;
        toSave.body = note.body_temp;

        studentService.updateIepNoteForStudent($scope.student.id, iep.id, note.id, toSave).then(
            function success(data) {
                note.date = moment(data.iep_goal_note.date);
                note.title = data.iep_goal_note.title;
                note.title_temp = data.iep_goal_note.title;
                note.body = data.iep_goal_note.body;
                note.body_temp = data.iep_goal_note.body;

                if(note.editing) {
                    $scope.toggleEditNote(note, false);
                }
            },
            function error(response) {
                toastService.error('The server wasn\'t able to save the note.');
            },
        );
    }

    $scope.deleteNote = function(iep, note) {
        studentService.deleteIepNoteForStudent($scope.student.id, iep.id, note.id).then(
            function success(data) {
                var index = _.findIndex(iep.notes, function(elem) { return elem.id === note.id; });
                iep.notes.splice(index, 1);
            },
            function error(response) {
                toastService.error('The server wasn\'t able to delete the note.');
            },
        );
    }

    $scope.addIep = function() {
        var toSave = copyIep($scope.newIep);
        if(toSave.quantitative === 'Yes') {
            toSave.quantitative = true;
            toSave.quantitative_category = 'none';
            if(toSave.quantitative_target === undefined || toSave.quantitative_target === '') {
                toSave.quantitative_target = null;
            }
        }
        else {
            toSave.quantitative = false;
        }

        toSave.due_date = toSave.due_date.format('YYYY-MM-DD').toString();

        studentService.addIepForStudent($scope.student.id, toSave).then(
            function success(data) {
                var newIep = data.iep_goal;
                newIep.editing = false;
                newIep.addingData = false;
                newIep.addingNote = false;
                newIep.due_date = moment(newIep.due_date);
                newIep.due_date_temp = moment(newIep.due_date);
                newIep.title_temp = newIep.title;
                newIep.quantitative_target_temp = newIep.quantitative_target;
                resetNewData(newIep);
                resetNewNote(newIep);
                
                $scope.ieps.push(newIep);

                if($scope.addingIep) {
                    $scope.toggleAddIep(false);
                }

                $scope.selectIep(newIep);

                //$scope.updateIep(newIep);
            },
            function error(response) {
                toastService.error('The server wasn\'t able to create the new IEP.');
            },
        );

    };

    $scope.saveIep = function(iep) {
        var toSave = copyIep(iep);

        toSave.title               = iep.title_temp;
        toSave.due_date            = iep.due_date_temp.format('YYYY-MM-DD').toString();
        toSave.quantitative_target = iep.quantitative_target_temp;
        if(toSave.quantitative_target === undefined || toSave.quantitative_target === '') {
            toSave.quantitative_target = null;
        }

        studentService.updateIepForStudent($scope.student.id, iep.id, toSave).then(
            function success(data) {
                iep.title                    = data.iep_goal.title;
                iep.title_temp               = data.iep_goal.title;
                iep.due_date                 = moment(data.iep_goal.due_date);
                iep.due_date_temp            = moment(data.iep_goal.due_date);
                iep.quantitative_target      = data.iep_goal.quantitative_target;
                iep.quantitative_target_temp = data.iep_goal.quantitative_target;

                if(iep.editing) {
                    $scope.toggleEditIep(iep, false);
                }

                updateIepTarget(iep);
            },
            function error(response) {
                toastService.error('The server wasn\'t able to save the measurement.');
            },
        );
    }

    $scope.deleteIep = function(iep) {
        studentService.deleteIepForStudent($scope.student.id, iep.id).then(
            function success(data) {
                var index = _.findIndex($scope.ieps, function(elem) { return elem.id === iep.id; });
                $scope.ieps.splice(index, 1);
                if($scope.selectedIep.id === iep.id) {
                    if($scope.ieps.length > 0) {
                        $scope.selectIep($scope.ieps[0]);
                    }
                    else {
                        $scope.selectIep({});
                    }
                }

                toastService.success('Your IEP has been deleted.');
            },
            function error(data) {
                toastService.error('The server wasn\'t able to delete the IEP.');
            },
        );
    };

    if($scope.ieps.length > 0) {
        $scope.selectIep($scope.ieps[0]);
    }
    else {
        $scope.selectIep({});
    }
});
