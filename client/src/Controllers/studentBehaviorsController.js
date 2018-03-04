app.controller("studentBehaviorsController", function ($scope, $routeParams, $location, toastService, behaviorService, data, student) {
    $scope.location = $location;

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

    //// create enrollment-to-index lookup, where order is index into graph data array
    //$scope.enrollmentToIndex = {};
    //_.each($scope.enrollments, function(enrollmentElem) {
        //$scope.enrollmentToIndex[enrollmentElem.id] = _.findIndex($scope.sections, function(sectionElem) { return enrollmentElem.section === sectionElem.id });
    //});
    
    //$scope.orderedCurSeries   = [];
    $scope.sectionToDataIndex = {};

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
        series: [],
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
                $scope.sharedGraph.series = [];
                $scope.behaviorGraph.data = [];
                $scope.effortGraph.data   = [];

                //if(data.sections.length >= $scope.sharedGraph.series) {
                    //// we can preserve colors
                    //var removedSections = [];
                    //_.each($scope.orderedCurSeries, function(elem) {
                        //if(!_.find(data.sections, function(secElem) { return secElem.id === elem.id; })) {
                            //removedSections.push(elem);
                        //}
                    //});

                    //var addedSections = [];
                    //_.each(data.sections, function(elem) {
                        //if(!_.has($scope.sectionToDataIndex, elem.id)) {
                            //addedSections.push(elem);
                        //}
                    //});

                    //// replace any removed old sections
                    //if(removedSections.length > 0) {
                        //for(var i = 0; i < $scope.orderedCurSeries.length; ++i) {
                            //var cur = $scope.orderedCurSeries[i];
                            //if(_.find(removedSections, function(elem) { return elem.id === cur.id; })) {
                                //// elem is will be removed
                                //delete $scope.sectionToDataIndex[elem.id];

                                //// something must be added because there are equal or more sections, and something was removed
                                //var newSection = addedSections[0];
                                //$scope.sectionToDataIndex[newSection.id] = i;
                                //$scope.sharedGraph.series[i] = newSection.title;
                                //$scope.orderedCurSeries[i] = newSection;
                                //addedSections.splice(0, 1);
                            //}
                        //}
                    //}

                    //// add on the rest of the new sections
                    //_.each(addedSections, function(elem) {
                        //$scope.orderedCurSeries.push(elem);
                        //$scope.sharedGraph.series.push(elem.title);
                        //$scope.sectionToDataIndex[elem.id] = $scope.orderedCurSeries.length - 1;
                    //});

                    //// always needs to be done
                    //for(var i = 0; i < data.sections.length; ++i) {
                        //$scope.behaviorGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                        //$scope.effortGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    //}
                //}
                //else {
                    // then just restart ordering
                    //$scope.orderedCurSeries   = [];
                    $scope.sectionToDataIndex = {};
                    //var sections = _.sortBy(data.sections, 'title');
                    for(var i = 0; i < data.sections.length; ++i) {
                        $scope.behaviorGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                        $scope.effortGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                        //$scope.orderedCurSeries.push(data.sections[i]);
                        $scope.sharedGraph.series.push(data.sections[i].title);
                        $scope.sectionToDataIndex[data.sections[i].id] = $scope.sharedGraph.series.length - 1;
                    }
                //}


                //$scope.sectionToDataIndex = {};
                //var sections = _.sortBy(data.sections, 'title');
                //for(var i = 0; i < data.sections.length; ++i) {
                    //// these are null no matter what, so just need to be added
                    //$scope.behaviorGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    //$scope.effortGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    //if(!_.has($scope.sectionToDataIndex, data.sections[i].id)) {
                        //$scope.sharedGraph.series.push(data.sections[i].title);
                        //$scope.sectionToDataIndex[data.sections[i].id] = $scope.sharedGraph.series.length - 1;
                    //}
                //}

                //// make sure there are enough arrays for each class, for each day
                //_.each($scope.sections, function() {
                    //$scope.behaviorGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    //$scope.effortGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                //});

                // iterate through each date, setting data as necessary
                var iterDate = $scope.graphStartDate.clone();
                var j = 0;
                for(var i = 0; i < dateDiff + 1; i++) {
                    $scope.sharedGraph.labels[i] = iterDate.format('MM/DD').toString();

                    if(data.behaviors[j]) {
                        var behaviorDate = moment(data.behaviors[j].date);
                        while(behaviorDate.diff(iterDate, 'd') === 0) {
                            var enrollment = $scope.enrollmentsLookup[data.behaviors[j].enrollment];
                            if(_.has($scope.sectionToDataIndex, enrollment.section)) {
                                $scope.behaviorGraph.data[$scope.sectionToDataIndex[enrollment.section]][i] = data.behaviors[j].behavior;
                                $scope.effortGraph.data[$scope.sectionToDataIndex[enrollment.section]][i] = data.behaviors[j].effort;
                                //$scope.effortGraph.data[$scope.enrollmentToIndex[data.behaviors[j].enrollment]][i] = data.behaviors[j].effort;
                                //$scope.effortGraph.data[$scope.enrollmentToIndex[data.behaviors[j].enrollment]][i] = data.behaviors[j].effort;
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
                // notify the user
                toastService.error('The server wasn\'t able to get student behaviors.');
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
    $scope.inputOptions = [
        {
            display: "",
            value: null, 
        },
        {
            display: "1",
            value: 1, 
        },
        {
            display: "2",
            value: 2, 
        },
        {
            display: "3",
            value: 3, 
        },
        {
            display: "4",
            value: 4, 
        },
        {
            display: "5",
            value: 5, 
        },
    ];

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
    //$scope.scoresInput = [];
    //_.each($scope.sections, function(elem, index) {
        //$scope.scoresInput.push({
            //title: elem.title,
            //enrollment: $scope.sectionsToEnrollments[elem.id].id,
            //id: null,
            //behavior: null,
            //curBehavior: null,
            //effort: null,
            //curEffort: null,
            //date: null,
        //});
    //});
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
                // notify user
                toastService.error('The server wasn\'t able to get student behaviors.');
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
                    // notify the user
                    toastService.error('The server wasn\'t able to save the behavior score.');
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
                    // notify the user
                    toastService.error('The server wasn\'t able to save the behavior score.');
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
