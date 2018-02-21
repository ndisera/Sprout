app.controller("studentBehaviorsController", function ($scope, $rootScope, $routeParams, behaviorService, data, student) {
    // I know this will be here, because I filtered on the student ID, and only that student
    $scope.student     = student.student;
    $scope.enrollments = [];
    $scope.sections    = [];

    if(data.enrollments !== null && data.enrollments !== undefined) {
        $scope.enrollments = data.enrollments;
    }
    if(data.sections !== null && data.sections !== undefined) {
        $scope.sections = data.sections;
    }

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
        $scope.enrollmentToIndex[enrollmentElem.id] = _.findIndex($scope.sections, function(sectionElem) { return enrollmentElem.section === sectionElem.id });
    });

    $scope.errorMessages = [];
    if($scope.enrollments.length === 0) {
        $scope.errorMessages.push("It looks like this student isn't registered for any classes.");
    }


    /**
     * graph-related code
     */
    var graphStartDateKey = 'graphStartDate';
    var graphEndDateKey   = 'graphEndDate';

    // calculate first and last days of school week
    $scope[graphStartDateKey] = moment().startOf('isoWeek');
    $scope[graphEndDateKey]   = moment().startOf('isoWeek').add(4, 'd');

    // all common behavior/effort graph settings
    $scope.sharedGraph = {
        labels: [],
        series: _.pluck($scope.sections, 'title'),
        options: {
            elements: {
                line: {
                    fill: false,
                },
            },
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
        colors: [
            "rgba(255,99,132,0.7)",
            "rgba(255,159,64,0.7)",
            "rgba(255,205,86,0.7)",
            "rgba(75,192,192,0.7)",
            "rgba(54,162,235,0.7)",
            "rgba(153,102,255,0.7)",
            "rgba(201,203,207,0.7)",
        ],
    };

    // start off the two graphs with empty datasets
    $scope.behaviorGraph = { data: [], };
    $scope.effortGraph   = { data: [], };

    /**
     * called when start or end daterange picker changed
     * updates min/max values of date range, updates graph
     *
     * @param {string} varName - name of datepicker that was change
     * @param {newDate} newDate - new date that was selected
     *
     * @return {void}
     */
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

    /**
     * updates the graphs on the page
     *
     * @return {void}
     */
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

                    if(data.behaviors[j]) {
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
                    }

                    iterDate.add(1, 'd');
                }
            },
            function error(response) {
                //TODO: notify the user
            }
        );
    }


    /**
     * input-scores related code
     */
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

    // get today for input box, set input options
    $scope.inputDate = moment();
    $scope.inputOptions = [1, 2, 3, 4, 5];

    /**
     * called when input datepicker is changed
     * updates the input date and all relevant scores
     *
     * @param {string} varName - name of picker that was changed
     * @param {datetime} newDate - new date that was selected
     *
     * @return {void}
     */
    $scope.inputDateChange = function(varName, newDate) {
        $scope.inputDate = newDate;
        updateInputScores();
    };


    /**
     * updates input boxes and their scores
     *
     * @return {void}
     */
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
                // if there's already a record for the day, set it
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
                        // otherwise, clear it out
                        elem.id          = null;
                        elem.behavior    = null;
                        elem.curBehavior = null;
                        elem.effort      = null;
                        elem.curEffort   = null;
                        elem.date        = $scope.inputDate.format('YYYY-MM-DD').toString();
                    }
                });
            },
            function error(response) {
                //TODO: notify user
            }
        );
    }


    /**
     * either saves a new score, or edits an existing score
     * called when any value changes in score input section
     * (I hate that there's so much repeated code...)
     *
     * @param {object} entry - entry from $scope.inputScores that has changed
     * @param {string} type - either 'behavior' or 'effort'
     *
     * @return {void}
     */
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
                    //TODO: notify the user
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
                    //TODO: notify the user
                }
            );
        }
    }

    /**
     * initialization
     */
    updateGraph();
    updateInputScores();

});





