app.controller("studentBehaviorsController", function ($scope, $routeParams, $location, toastService, behaviorService, data, terms, student) {
    $scope.location = $location;

    // I know this will be here, because I filtered on the student ID, and only that student
    $scope.student               = student.student;
    $scope.enrollments           = [];
    $scope.enrollmentsLookup     = {};
    $scope.sectionsToEnrollments = {};

    $scope.sections              = [];
    $scope.sectionsLookup        = {};

    $scope.terms                 = [];
    // each subarray represents term and has all sections in that term (array to preserve order, and term id not sequential)
    $scope.sectionsByTerm        = [];
    // will give index into sectionsByTerm if given a term id
    $scope.termToSectionsByTerm  = {};
    // will give index into graph's data array if given section id
    $scope.sectionToDataIndex    = {};

    if(data !== null && data !== undefined) {
        if(data.enrollments !== null && data.enrollments !== undefined) {
            $scope.enrollments = data.enrollments;
            // set up lookup for enrollments
            $scope.enrollmentsLookup     = _.indexBy(data.enrollments, 'id');
            $scope.sectionsToEnrollments = _.indexBy(data.enrollments, 'section');
        }
        if(data.sections !== null && data.sections !== undefined) {
            $scope.sections = data.sections;
            // for now, sort sections alphabetically
            $scope.sections       = _.sortBy(data.sections, 'title');
            $scope.sectionsLookup = _.indexBy(data.sections, 'id');
        }
    }
    if(terms !== null && terms !== undefined && terms.terms !== null && terms.terms !== undefined) {
        $scope.terms = terms.terms;
        _.each($scope.terms, function(elem) {
            elem.start_date = moment(elem.start_date);
            elem.end_date   = moment(elem.end_date);
        });
        $scope.terms = _.sortBy($scope.terms, function(elem) { return -elem.start_date; });
    }

    // set up term-lookup variables
    _.each($scope.terms, function(elem) {
        $scope.sectionsByTerm.push([]);
        $scope.termToSectionsByTerm[elem.id] = $scope.sectionsByTerm.length - 1;
    });

    _.each($scope.sections, function(elem) {
        $scope.sectionsByTerm[$scope.termToSectionsByTerm[elem.term]].push(elem);
    });

    function termsByDateRange(terms, startDate, endDate) {
        var includedTerms = [];
        _.each(terms, function(elem) {
            // startDate in the middle of the term
            // endDate in the middle of the term
            // startDate and endDate between term dates taken care of by above
            // term dates between startDate and endDate
            if(startDate >= elem.start_date && startDate <= elem.end_date
                || endDate >= elem.start_date && endDate <= elem.end_date
                || startDate <= elem.start_date && endDate >= elem.end_date) {
                includedTerms.push(elem.id);
            }
        });
        return includedTerms;
    }

    function termsByDate(terms, date) {
        var includedTerms = [];
        _.each(terms, function(elem) {
            // is the date between term start/end
            if(date >= elem.start_date && date <= elem.end_date) {
                includedTerms.push(elem.id);
            }
        });
        return includedTerms;
    }
    
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
        };

        behaviorService.getStudentBehavior(config).then(
            function success(data) {
                // calculate how many entries of data our graph will have
                var dateDiff = $scope.graphEndDate.diff($scope.graphStartDate, 'd');

                // clear labels and data
                $scope.sharedGraph.labels = [];
                $scope.sharedGraph.series = [];
                $scope.behaviorGraph.data = [];
                $scope.effortGraph.data   = [];
                $scope.sharedGraph.datasetOverride = [];

                var termsToInclude = termsByDateRange($scope.terms, $scope.graphStartDate, $scope.graphEndDate);

                var hasSection = false;
                _.each(termsToInclude, function(termId) {
                    _.each($scope.sectionsByTerm[$scope.termToSectionsByTerm[termId]], function(section) {
                        hasSection = true;
                        $scope.sharedGraph.series.push(section.title);
                        $scope.behaviorGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                        $scope.effortGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                        $scope.sectionToDataIndex[section.id] = $scope.behaviorGraph.data.length - 1;
                    });
                });

                if(hasSection === false) {
                    $scope.sharedGraph.series = ["", ];
                    $scope.sectionToDataIndex = {};
                    $scope.behaviorGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    $scope.effortGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    $scope.sharedGraph.options.legend.display = false;
                }
                else {
                    $scope.sharedGraph.options.legend.display = true;
                }

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
                $scope.scoresInput = [];
                var newBehaviorsMap = _.indexBy(data.behaviors, 'enrollment');

                var termsToInclude = termsByDate($scope.terms, $scope.inputDate);
                _.each(termsToInclude, function(termId) {
                    _.each($scope.sectionsByTerm[$scope.termToSectionsByTerm[termId]], function(section) {
                        var enrollmentRecord = $scope.sectionsToEnrollments[section.id];
                        var record           = newBehaviorsMap[enrollmentRecord.id];
                        $scope.scoresInput.push({
                            title: section.title,
                            enrollment: enrollmentRecord.id,
                            section: section.id,
                            id: record ? record.id : null,
                            behavior: record ? record.behavior : null,
                            curBehavior: record ? record.behavior : null,
                            effort: record ? record.effort : null,
                            curEffort: record ? record.effort : null,
                            date: $scope.inputDate.format('YYYY-MM-DD').toString(),
                        });
                    });
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
                    var updatedEntry = data.behavior;

                    entry.behavior    = updatedEntry.behavior;
                    entry.curBehavior = updatedEntry.behavior;
                    entry.effort      = updatedEntry.effort;
                    entry.curEffort   = updatedEntry.effort;

                    // update the graph
                    var entryDate = moment(updatedEntry.date);
                    if(entryDate >= $scope.graphStartDate && entryDate <= $scope.graphEndDate) {
                        var index     = $scope.sectionToDataIndex[entry.section];
                        var dateIndex = Math.abs($scope.graphStartDate.diff(entryDate, 'd'));
                        if(type === 'behavior') {
                            $scope.behaviorGraph.data[index][dateIndex] = updatedEntry.behavior;
                        }
                        if(type === 'effort') {
                            $scope.effortGraph.data[index][dateIndex] = updatedEntry.effort;
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
                    if(entryDate >= $scope.graphStartDate && entryDate <= $scope.graphEndDate) {
                        var index     = $scope.sectionToDataIndex[entry.section];
                        var dateIndex = Math.abs($scope.graphStartDate.diff(entryDate, 'd'));
                        if(type === 'behavior') {
                            $scope.behaviorGraph.data[index][dateIndex] = updatedEntry.behavior;
                        }
                        if(type === 'effort') {
                            $scope.effortGraph.data[index][dateIndex] = updatedEntry.effort;
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
