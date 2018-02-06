app.controller("studentBehaviorsController", function ($scope, $rootScope, $routeParams, behaviorService, data) {
    var graphStartDateKey = 'graphStartDate';
    var graphEndDateKey   = 'graphEndDate';

    $scope.inputOptions = [1, 2, 3, 4, 5];

    /**
     * start with default date calculations
     */
    // calculate first and last days of school week
    $scope[graphStartDateKey] = moment().startOf('isoWeek');
    $scope[graphEndDateKey]   = moment().startOf('isoWeek').add(4, 'd');

    // get today
    $scope.inputDate = moment();

    /**
     * set up starting data sets
     */
    // I know this will be here, because I filtered on the student ID, and only that student
    $scope.student = data.students[0];

    // all common behavior/effort graph settings
    $scope.sharedGraph = {
        labels: [],
        series: [],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        min: 1,
                        stepSize: 1,
                        max: 5
                    }
                }]
            },
            legend:
            {
                display: true
            }
        },
    };

    // start off the two graphs with shared settings
    $scope.behaviorGraph = { data: [], };
    $scope.effortGraph   = { data: [], };

    /**
     * initialize everything using default dates
     */
    updateEnrollmentsSections(data);
    updateGraph();
    updateInputScores();

    $scope.graphDateRangeChange = function(varName, newDate) {
        // update date
        $scope[varName] = newDate;

        // broadcast event to update min/max values
        if(varName === graphStartDateKey) {
            $scope.$broadcast('pickerUpdate', graphEndDateKey, { minDate: $scope[graphStartDateKey] });
        }
        else if(varName === graphEndDateKey) {
            $scope.$broadcast('pickerUpdate', graphStartDateKey, { maxDate: $scope[graphEndDateKey] });
        }

        updateGraph();
    };

    $scope.inputDateChange = function(varName, newDate) {
        $scope.inputDate = newDate;
        updateInputScores();
    };


    function updateEnrollmentsSections(data) {
        // for now, sort sections alphabetically
        $scope.sections       = _.sortBy(data.sections, 'title');
        $scope.sectionsLookup = _.indexBy(data.sections, 'id');

        // set up lookup for enrollments
        $scope.enrollments           = data.enrollments;
        $scope.enrollmentsLookup     = _.indexBy(data.enrollments, 'id');
        $scope.sectionsToEnrollments = _.indexBy(data.enrollments, 'section');

        // create enrollment-to-index lookup, where order is index into graph data array
        $scope.enrollmentToIndex = {};
        _.each($scope.enrollments, function(enrollmentElem) {
            $scope.enrollmentToIndex[enrollmentElem.id] = _.findIndex($scope.sections, function(sectionElem) {
                return enrollmentElem.section === sectionElem.id
            });
        });

        $scope.sharedGraph.series = _.pluck($scope.sections, 'title');

        // update input sections object
        $scope.scoresInput = [];
        _.each($scope.sections, function(elem, index) {
            $scope.scoresInput.push({
                title: elem.title,
                enrollment: $scope.sectionsToEnrollments[elem.id].id,
                id: null,
                behavior: null,
                curBehavior: null,
                effort: null,
                curEffort: null,
                date: null,
            });
        });
    }


    function updateGraph() {
        var config = {
            include: ['enrollment.section.*',],
            exclude: ['id',],
            filter: [
                { name: 'date.range', val: $scope.graphStartDate.format('YYYY-MM-DD').toString(), },
                { name: 'date.range', val: $scope.graphEndDate.format('YYYY-MM-DD').toString(), },
                { name: 'enrollment.student', val: $scope.student.id, },
            ],
            sort: ['date',],
        }

        behaviorService.getStudentBehavior(config).then(
            function success(data) {
                // check to see if the student is enrolled in more classes, update if so
                //if(_.union(_.pluck($scope.enrollments, 'id'), _.pluck(data.enrollments, 'id')).length !== $scope.enrollments.length) {
                   //updateEnrollmentsSections(data);
                //}

                // calculate how many entries of data our graph will have
                var dateDiff = $scope.graphEndDate.diff($scope.graphStartDate, 'd');

                // clear labels and data
                $scope.sharedGraph.labels = [];

                $scope.behaviorGraph.data = [];
                $scope.effortGraph.data   = [];

                // make sure there are enough arrays for each class, for each day
                _.each($scope.sections, function() {
                    $scope.behaviorGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    $scope.effortGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                });

                // iterate through each date, setting data as necessary
                var iterDate = $scope.graphStartDate.clone();
                var j = 0;
                for(var i = 0; i < dateDiff + 1; i++) {
                    $scope.sharedGraph.labels[i] = iterDate.format('MM/DD').toString();

                    var behaviorDate = moment(data.behaviors[j].date);
                    while(behaviorDate.diff(iterDate, 'd') === 0) {
                        if(_.has($scope.enrollmentToIndex, data.behaviors[j].enrollment)) {
                            $scope.behaviorGraph.data[$scope.enrollmentToIndex[data.behaviors[j].enrollment]][i] = data.behaviors[j].behavior;
                            $scope.effortGraph.data[$scope.enrollmentToIndex[data.behaviors[j].enrollment]][i] = data.behaviors[j].effort;
                        }

                        j++;
                        if(j >= data.behaviors.length) { break; }
                        behaviorDate = moment(data.behaviors[j].date);
                    }

                    iterDate.add(1, 'd');
                }
            },
            function error(response) {
                //TODO: notify the user
            }
        );
    }

    function updateInputScores() {
        var config = {
            include: ['enrollment.section.*',],
            filter: [
                { name: 'date', val: $scope.inputDate.format('YYYY-MM-DD').toString(), },
                { name: 'enrollment.student', val: $scope.student.id, },
            ],
        }

        behaviorService.getStudentBehavior(config).then(
            function success(data) {
                var newBehaviorsMap = _.indexBy(data.behaviors, 'enrollment');
                _.each($scope.scoresInput, function(elem) {
                    if(_.has(newBehaviorsMap, elem.enrollment)) {
                        var behaviorElem = newBehaviorsMap[elem.enrollment];
                        elem.id          = behaviorElem.id;
                        elem.behavior    = behaviorElem.behavior;
                        elem.curBehavior = behaviorElem.behavior;
                        elem.effort      = behaviorElem.effort;
                        elem.curEffort   = behaviorElem.effort;
                        elem.date        = behaviorElem.date;
                    }
                    else {
                        elem.id          = null;
                        elem.behavior    = null;
                        elem.curBehavior = null;
                        elem.effort      = null;
                        elem.curEffort   = null;
                        elem.date        = $scope.inputDate.format('YYYY-MM-DD').toString();
                    }
                });
                //_.each(data.behaviors, function(behaviorElem, index) {
                    //var score = _.find($scope.scoresInput, function(scoreElem) { return behaviorElem.enrollment === scoreElem.enrollment; });
                    //if(score !== undefined) {
                        //score.id          = behaviorElem.id;
                        //score.behavior    = behaviorElem.behavior;
                        //score.curBehavior = behaviorElem.behavior;
                        //score.effort      = behaviorElem.effort;
                        //score.curEffort   = behaviorElem.effort;
                        //score.date        = behaviorElem.date;
                    //}
                //});
            },
            function error(response) {
                //TODO: notify user
            }
        );
    }


    $scope.saveScore = function(entry, type) {
        var newObj = {
            enrollment: entry.enrollment,
            behavior: entry.behavior,
            effort: entry.effort,
            date: entry.date,
        };

        if(type === 'behavior') {
            newObj.behavior = entry.curBehavior;
        }
        if(type === 'effort') {
            newObj.effort = entry.curEffort;
        }

        if(entry.id !== null) {
            behaviorService.updateBehavior(entry.id, newObj).then(
                function success(data) {
                    updatedEntry = data.behavior;

                    entry.behavior    = updatedEntry.behavior;
                    entry.curBehavior = updatedEntry.behavior;
                    entry.effort      = updatedEntry.effort;
                    entry.curEffort   = updatedEntry.effort;

                    // update the graph
                    var entryDate = moment(updatedEntry.date);
                    var startDateDiff = $scope.graphStartDate.diff(entryDate, 'd');
                    var endDateDiff = $scope.graphEndDate.diff(entryDate, 'd');
                    if(startDateDiff <= 0 && endDateDiff >= 0) {
                        var sectionIndex = $scope.enrollmentToIndex[updatedEntry.enrollment];
                        var dateIndex    = Math.abs(startDateDiff);
                        if(type === 'behavior') {
                            $scope.behaviorGraph.data[sectionIndex][dateIndex] = updatedEntry.behavior;
                        }
                        if(type === 'effort') {
                            $scope.effortGraph.data[sectionIndex][dateIndex] = updatedEntry.effort;
                        }
                    }
                },
                function error(response) {

                }
            );
        }
        else {
            behaviorService.addBehavior(newObj).then(
                function success(data) {
                    updatedEntry = data.behavior;

                    entry.id          = updatedEntry.id;
                    entry.behavior    = updatedEntry.behavior;
                    entry.curBehavior = updatedEntry.behavior;
                    entry.effort      = updatedEntry.effort;
                    entry.curEffort   = updatedEntry.effort;
                    entry.date        = updatedEntry.date;

                    // update the graph
                    var entryDate = moment(updatedEntry.date);
                    var startDateDiff = $scope.graphStartDate.diff(entryDate, 'd');
                    var endDateDiff = $scope.graphEndDate.diff(entryDate, 'd');
                    if(startDateDiff <= 0 && endDateDiff >= 0) {
                        var sectionIndex = $scope.enrollmentToIndex[updatedEntry.enrollment];
                        var dateIndex    = Math.abs(startDateDiff);
                        if(type === 'behavior') {
                            $scope.behaviorGraph.data[sectionIndex][dateIndex] = updatedEntry.behavior;
                        }
                        if(type === 'effort') {
                            $scope.effortGraph.data[sectionIndex][dateIndex] = updatedEntry.effort;
                        }
                    }
                },
                function error(response) {

                }
            );
            // post
        }



    }


});
