app.controller("studentBehaviorsController", function($scope, $routeParams, $location, toastService, behaviorService, data, terms, student) {
    $scope.location = $location;

    $scope.report = {};

    // I know this will be here, because I filtered on the student ID, and only that student
    $scope.student = student.student;
    $scope.enrollments = [];
    $scope.enrollmentsLookup = {};
    $scope.sectionsToEnrollments = {};

    $scope.sections = [];
    $scope.sectionsLookup = {};

    $scope.terms = [];
    // each subarray represents term and has all sections in that term (array to preserve order, and term id not sequential)
    $scope.sectionsByTerm = [];
    // will give index into sectionsByTerm if given a term id
    $scope.termToSectionsByTerm = {};
    // will give index into graph's data array if given section id
    $scope.sectionToDataIndex = {};

    if (data !== null && data !== undefined) {
        if (data.enrollments !== null && data.enrollments !== undefined) {
            $scope.enrollments = data.enrollments;
            // set up lookup for enrollments
            $scope.enrollmentsLookup = _.indexBy(data.enrollments, 'id');
            $scope.sectionsToEnrollments = _.indexBy(data.enrollments, 'section');
        }
        if (data.sections !== null && data.sections !== undefined) {
            $scope.sections = data.sections;
            // for now, sort sections alphabetically
            $scope.sections = _.sortBy(data.sections, 'title');
            $scope.sectionsLookup = _.indexBy(data.sections, 'id');

            // classOptions for report will include class names and an all classes option
            $scope.classOptions = [];
            $scope.classOptions.push("All Classes");
            _.each($scope.sections, function(elem) {
                $scope.classOptions.push(elem.title);
            });
        }
    }
    if (terms !== null && terms !== undefined && terms.terms !== null && terms.terms !== undefined) {
        $scope.terms = terms.terms;
        _.each($scope.terms, function(elem) {
            elem.start_date = moment(elem.start_date);
            elem.end_date = moment(elem.end_date);
        });
        $scope.terms = _.sortBy($scope.terms, function(elem) {
            return -elem.start_date;
        });
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
            if (startDate >= elem.start_date && startDate <= elem.end_date ||
                endDate >= elem.start_date && endDate <= elem.end_date ||
                startDate <= elem.start_date && endDate >= elem.end_date) {
                includedTerms.push(elem.id);
            }
        });
        return includedTerms;
    }

    function termsByDate(terms, date) {
        var includedTerms = [];
        _.each(terms, function(elem) {
            // is the date between term start/end
            if (date >= elem.start_date && date <= elem.end_date) {
                includedTerms.push(elem.id);
            }
        });
        return includedTerms;
    }

    /**
     * graph-related code
     */
    var graphStartDateKey = 'graphStartDate';
    var graphEndDateKey = 'graphEndDate';

    // calculate first and last days of school week
    $scope[graphStartDateKey] = moment().startOf('isoWeek');
    $scope[graphEndDateKey] = moment().startOf('isoWeek').add(4, 'd');

    //TODO(gzuber): there must be a better way to do this...
    function legendClick(e, legendItem) {
        var index = legendItem.datasetIndex;
        var value = true;
        if (this.chart.options.graph === 'behavior') {
            if ($scope.activeBehaviorLegendItem === index) {
                value = null;
                $scope.activeBehaviorLegendItem = null;
            } else {
                $scope.activeBehaviorLegendItem = index;
            }
        }
        if (this.chart.options.graph === 'effort') {
            if ($scope.activeEffortLegendItem === index) {
                value = null;
                $scope.activeEffortLegendItem = null;
            } else {
                $scope.activeEffortLegendItem = index;
            }
        }

        var i = 0;
        var cont = true;
        while (cont) {
            try {
                this.chart.getDatasetMeta(i).hidden = value;
                i++;
            } catch (err) {
                cont = false;
            }
        }
        this.chart.getDatasetMeta(index).hidden = null;
        this.chart.update();
    }

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
                        min: 0,
                        stepSize: 1,
                        max: 5
                    }
                }]
            },
            legend: {
                onClick: legendClick,
                display: true,
            }
        },
    };

    // start off the two graphs with empty datasets
    $scope.behaviorGraph = {
        data: [],
        options: _.clone($scope.sharedGraph.options),
    };
    $scope.effortGraph = {
        data: [],
        options: _.clone($scope.sharedGraph.options),
    };

    $scope.behaviorGraph.options.graph = 'behavior';
    $scope.effortGraph.options.graph = 'effort';

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
        if (varName === graphStartDateKey) {
            $scope.$broadcast('pickerUpdate', graphEndDateKey, {
                minDate: $scope[graphStartDateKey]
            });
        } else if (varName === graphEndDateKey) {
            $scope.$broadcast('pickerUpdate', graphStartDateKey, {
                maxDate: $scope[graphEndDateKey]
            });
        }

        $scope.activeEffortLegendItem = null;
        $scope.activeBehaviorLegendItem = null;

        updateGraph();
    };

    /**
     * updates the graphs on the page
     *
     * @return {void}
     */
    function updateGraph() {
        var config = {
            include: ['enrollment.section.*', ],
            exclude: ['id', ],
            filter: [{
                    name: 'date.range',
                    val: $scope.graphStartDate.format('YYYY-MM-DD').toString(),
                },
                {
                    name: 'date.range',
                    val: $scope.graphEndDate.format('YYYY-MM-DD').toString(),
                },
                {
                    name: 'enrollment.student',
                    val: $scope.student.id,
                },
            ],
            sort: ['date', ],
        };

        behaviorService.getStudentBehavior(config).then(
            function success(data) {
                // calculate how many entries of data our graph will have
                var dateDiff = $scope.graphEndDate.diff($scope.graphStartDate, 'd');

                // clear labels and data
                $scope.sharedGraph.labels = [];
                $scope.sharedGraph.series = [];
                $scope.behaviorGraph.data = [];
                $scope.effortGraph.data = [];
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

                $scope.sharedGraph.options.legend.display = true;
                if (hasSection === false) {
                    $scope.sharedGraph.series = ["", ];
                    $scope.sectionToDataIndex = {};
                    $scope.behaviorGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    $scope.effortGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    $scope.sharedGraph.options.legend.display = false;
                }

                // iterate through each date, setting data as necessary
                var iterDate = $scope.graphStartDate.clone();
                var j = 0;
                for (var i = 0; i < dateDiff + 1; i++) {
                    $scope.sharedGraph.labels[i] = iterDate.format('MM/DD').toString();

                    if (data.behaviors[j]) {
                        var behaviorDate = moment(data.behaviors[j].date);
                        while (behaviorDate.diff(iterDate, 'd') === 0) {
                            var enrollment = $scope.enrollmentsLookup[data.behaviors[j].enrollment];
                            if (_.has($scope.sectionToDataIndex, enrollment.section)) {
                                $scope.behaviorGraph.data[$scope.sectionToDataIndex[enrollment.section]][i] = data.behaviors[j].behavior;
                                $scope.effortGraph.data[$scope.sectionToDataIndex[enrollment.section]][i] = data.behaviors[j].effort;
                            }

                            j++;
                            if (j >= data.behaviors.length) {
                                break;
                            }
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
    $scope.inputOptions = [{
            display: "",
            value: null,
        },
        {
            display: "0",
            value: 0,
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
            include: ['enrollment.section.*', ],
            filter: [{
                    name: 'date',
                    val: $scope.inputDate.format('YYYY-MM-DD').toString(),
                },
                {
                    name: 'enrollment.student',
                    val: $scope.student.id,
                },
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
                        var record = newBehaviorsMap[enrollmentRecord.id];
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

        if (type === 'behavior') {
            newObj.behavior = entry.curBehavior;
        }
        if (type === 'effort') {
            newObj.effort = entry.curEffort;
        }

        if (entry.id !== null) {
            behaviorService.updateBehavior(entry.id, newObj).then(
                function success(data) {
                    var updatedEntry = data.behavior;

                    entry.behavior = updatedEntry.behavior;
                    entry.curBehavior = updatedEntry.behavior;
                    entry.effort = updatedEntry.effort;
                    entry.curEffort = updatedEntry.effort;

                    // update the graph
                    var entryDate = moment(updatedEntry.date);
                    if (entryDate >= $scope.graphStartDate && entryDate <= $scope.graphEndDate) {
                        var index = $scope.sectionToDataIndex[entry.section];
                        var dateIndex = Math.abs($scope.graphStartDate.diff(entryDate, 'd'));
                        if (type === 'behavior') {
                            $scope.behaviorGraph.data[index][dateIndex] = updatedEntry.behavior;
                        }
                        if (type === 'effort') {
                            $scope.effortGraph.data[index][dateIndex] = updatedEntry.effort;
                        }
                    }
                },
                function error(response) {
                    // notify the user
                    toastService.error('The server wasn\'t able to save the behavior score.');
                }
            );
        } else {
            behaviorService.addBehavior(newObj).then(
                function success(data) {
                    updatedEntry = data.behavior;

                    entry.id = updatedEntry.id;
                    entry.behavior = updatedEntry.behavior;
                    entry.curBehavior = updatedEntry.behavior;
                    entry.effort = updatedEntry.effort;
                    entry.curEffort = updatedEntry.effort;
                    entry.date = updatedEntry.date;

                    // update the graph
                    var entryDate = moment(updatedEntry.date);
                    if (entryDate >= $scope.graphStartDate && entryDate <= $scope.graphEndDate) {
                        var index = $scope.sectionToDataIndex[entry.section];
                        var dateIndex = Math.abs($scope.graphStartDate.diff(entryDate, 'd'));
                        if (type === 'behavior') {
                            $scope.behaviorGraph.data[index][dateIndex] = updatedEntry.behavior;
                        }
                        if (type === 'effort') {
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
     * Brings up the report form
     */
    $scope.openReportForm = function() {
        $("#generateReportModal").modal();
    };

    /**
     * Downloads a report pdf
     */
    $scope.generateReport = function() {
        // do report stuff
        var imgData = 'data:image/jpeg;base64,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';
        var doc = new jsPDF();
        var startDate = moment($scope.report.startDate).format('YYYY-MM-DD').toString();
        var endDate = moment($scope.report.endDate).format('YYYY-MM-DD').toString();

        doc.setFontSize(26);
        doc.text(105, 25, 'Behavior and Effort Report', 'center');
        doc.text(105, 40, 'For ' + $scope.student.first_name + ' ' + $scope.student.last_name + ' in ' + $scope.report.class, 'center');
        doc.text(105, 55, startDate + " to " + endDate, 'center');
        doc.text(25, 117, 'Behavior', 'center');
        doc.text(25, 127, '4.5', 'center');
        doc.addImage(imgData, 'JPEG', 50, 70, 145, 100);
        doc.text(25, 227, 'Effort', 'center');
        doc.text(25, 237, '4.5', 'center');
        doc.addImage(imgData, 'JPEG', 50, 180, 145, 100);
        // doc.save($scope.student.first_name + $scope.student.last_name + '.pdf');
        doc.save('test.pdf');
        // clear report obj
        $scope.report = {};

        // close modal here since data-dismiss isn't working
        $('#generateReportModal').modal('toggle');
    };

    /**
     * initialization
     */
    updateGraph();
    updateInputScores();

});
