app.controller("studentBehaviorsController", function($scope, $routeParams, $location, toastService, behaviorService, studentService, data, terms, service, student) {
    $scope.location = $location;

    // I'm displaying all classes in the report dropdown, I need to display all classes that are valid for the chosen term
    // so populate with serires instead

    $scope.report = {};

    $scope.behaviorNote = {};
    $scope.editingNote = false;

    $scope.hasBehaviorService = false;
    if (service !== null && service !== undefined && service.service_requirements !== null && service.service_requirements !== undefined) {
        $scope.hasBehaviorService = service.service_requirements.length > 0;
    }

    // I know this will be here, because I filtered on the student ID, and only that student
    $scope.student = student.student;
    $scope.enrollments = [];
    $scope.enrollmentsLookup = {};
    $scope.sectionsToEnrollments = {};

    $scope.sections = [];
    $scope.sectionsLookup = {};
    $scope.sectionsLookupByTitle = {};

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
            $scope.sectionsLookupByTitle = _.indexBy(data.sections, 'title');
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

    /**
     * Fills the class options for the behavior report
     */
    function getClassOptions() {
        // classOptions for report
        $scope.classOptions = [];
        $scope.classOptions.push({
            id: null,
            title: "Average"
        });
        $scope.classOptions.push({
            id: null,
            title: "All Classes"
        });
        _.each($scope.sharedGraph.series, function(elem) {
            $scope.classOptions.push({
                // I just need the id for the corresponding class name, I'm just going to create a lookup at the start
                id: $scope.sectionsLookupByTitle[elem].id,
                title: elem
            });
        });
    }

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

    $scope.avgGraphOptions = {
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
            display: false,
        }
    }

    // start off the two graphs with empty datasets
    $scope.behaviorGraph = {
        data: [],
        options: _.clone($scope.sharedGraph.options),
    };
    $scope.effortGraph = {
        data: [],
        options: _.clone($scope.sharedGraph.options),
    };
    $scope.avgBehaviorGraph = {
        data: [],
        options: _.clone($scope.avgGraphOptions),
    };
    $scope.avgEffortGraph = {
        data: [],
        options: _.clone($scope.avgGraphOptions),
    };
    $scope.singleBehaviorGraph = {
        data: [
            []
        ],
        options: _.clone($scope.avgGraphOptions),
    };
    $scope.singleEffortGraph = {
        data: [
            []
        ],
        options: _.clone($scope.avgGraphOptions),
    };

    $scope.behaviorGraph.options.graph = 'behavior';
    $scope.effortGraph.options.graph = 'effort';
    // don't think this is actually necessary
    $scope.avgBehaviorGraph.options.graph = 'avgBehavior';
    $scope.avgEffortGraph.options.graph = 'avgEffort';

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
                $scope.avgBehaviorGraph.data = [];
                $scope.avgEffortGraph.data = [];
                $scope.sharedGraph.datasetOverride = [];
                // contains objects with count and sum
                $scope.behaviorAvgInfo = [];
                $scope.effortAvgInfo = [];

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

                // will only have one line
                $scope.avgBehaviorGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                $scope.avgEffortGraph.data.push(_.times(dateDiff + 1, _.constant(null)));

                // iterate through each date, setting data as necessary
                var iterDate = $scope.graphStartDate.clone();
                var j = 0;
                for (var i = 0; i < dateDiff + 1; i++) {
                    $scope.sharedGraph.labels[i] = iterDate.format('MM/DD').toString();

                    if (data.behaviors[j]) {
                        var behaviorDate = moment(data.behaviors[j].date);
                        // for calculating average
                        var behaviorCount = 0;
                        var behaviorSum = 0;
                        var effortCount = 0;
                        var effortSum = 0;
                        while (behaviorDate.diff(iterDate, 'd') === 0) {
                            // have to check for nulls before incrementing the total and calculating the average
                            var enrollment = $scope.enrollmentsLookup[data.behaviors[j].enrollment];
                            if (_.has($scope.sectionToDataIndex, enrollment.section)) {
                                if (data.behaviors[j].behavior != null) {
                                    behaviorCount++;
                                    behaviorSum += data.behaviors[j].behavior;
                                }
                                if (data.behaviors[j].effort != null) {
                                    effortCount++;
                                    effortSum += data.behaviors[j].effort;
                                }
                                $scope.behaviorGraph.data[$scope.sectionToDataIndex[enrollment.section]][i] = data.behaviors[j].behavior;
                                $scope.effortGraph.data[$scope.sectionToDataIndex[enrollment.section]][i] = data.behaviors[j].effort;
                            }

                            j++;
                            if (j >= data.behaviors.length) {
                                break;
                            }
                            behaviorDate = moment(data.behaviors[j].date);
                        }

                        // at this point if the count isn't 0, store avg info
                        $scope.behaviorAvgInfo[i] = {
                            count: behaviorCount,
                            sum: behaviorSum
                        };
                        $scope.effortAvgInfo[i] = {
                            count: effortCount,
                            sum: effortSum
                        };

                        if (behaviorCount > 0) {
                            $scope.avgBehaviorGraph.data[0][i] = behaviorSum / behaviorCount;
                        } else {
                            $scope.avgBehaviorGraph.data[0][i] = null;
                        }

                        if (effortCount > 0) {
                            $scope.avgEffortGraph.data[0][i] = effortSum / effortCount;
                        } else {
                            $scope.avgEffortGraph.data[0][i] = null;
                        }
                    }

                    iterDate.add(1, 'd');
                }

                getClassOptions();
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

        // update the date's comment
        var commentConfig = {
            filter: [{
                name: 'date',
                val: $scope.inputDate.format('YYYY-MM-DD').toString(),
            }, ],
        };

        studentService.getBehaviorNotesForStudent($scope.student.id, commentConfig).then(
            function success(data) {
                if (data.behavior_notes.length > 0) {
                    $scope.behaviorNote = data.behavior_notes[0];
                } else {
                    $scope.behaviorNote = {
                        date: $scope.inputDate.format('YYYY-MM-DD').toString(),
                        body: '',
                        id: null,
                        student: $scope.student.id,
                    };
                }

                $scope.behaviorNote.body_temp = $scope.behaviorNote.body;
            },
            function error(response) {
                // notify user
                toastService.error('The server wasn\'t able to get student behavior comment.');
            }
        );
    }

    $scope.toggleEditingNote = function(value) {
        $scope.editingNote = value;
        if (!value) {
            $scope.behaviorNote.body_temp = $scope.behaviorNote.body;
        }
    };

    $scope.saveNote = function() {
        var newNote = {
            date: $scope.behaviorNote.date,
            body: $scope.behaviorNote.body_temp,
            student: $scope.behaviorNote.student,
        };

        if ($scope.behaviorNote.id !== null && ($scope.behaviorNote.body_temp === null || $scope.behaviorNote.body_temp === undefined || $scope.behaviorNote.body_temp === '')) {
            studentService.deleteBehaviorNoteForStudent($scope.student.id, $scope.behaviorNote.id).then(
                function success(data) {
                    $scope.behaviorNote = {
                        date: $scope.inputDate.format('YYYY-MM-DD').toString(),
                        body: '',
                        id: null,
                        student: $scope.student.id,
                    };
                },
                function error(response) {
                    // notify user
                    toastService.error('The server wasn\'t able to save the student behavior comment.');
                }
            );
        } else if ($scope.behaviorNote.id !== null) {
            newNote.id = $scope.behaviorNote.id;

            studentService.updateBehaviorNoteForStudent($scope.student.id, newNote.id, newNote).then(
                function success(data) {
                    $scope.behaviorNote = data.behavior_note;
                    $scope.behaviorNote.body_temp = data.behavior_note.body;
                },
                function error(response) {
                    // notify user
                    toastService.error('The server wasn\'t able to save the student behavior comment.');
                }
            );
        } else {
            studentService.addBehaviorNoteForStudent($scope.student.id, newNote).then(
                function success(data) {
                    $scope.behaviorNote = data.behavior_note;
                    $scope.behaviorNote.body_temp = data.behavior_note.body;
                },
                function error(response) {
                    // notify user
                    toastService.error('The server wasn\'t able to save the student behavior comment.');
                }
            );
        }

        $scope.toggleEditingNote(false);
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

                    // update the graph and avg graph
                    var entryDate = moment(updatedEntry.date);
                    if (entryDate >= $scope.graphStartDate && entryDate <= $scope.graphEndDate) {
                        var index = $scope.sectionToDataIndex[entry.section];
                        var dateIndex = Math.abs($scope.graphStartDate.diff(entryDate, 'd'));
                        if (type === 'behavior') {
                            if (updatedEntry.behavior === null) {
                                $scope.behaviorAvgInfo[dateIndex].count--;
                                $scope.behaviorAvgInfo[dateIndex].sum -= $scope.behaviorGraph.data[index][dateIndex];
                                setNewAvg($scope.avgBehaviorGraph, $scope.behaviorAvgInfo, dateIndex);
                            } else {
                                if ($scope.behaviorGraph.data[index][dateIndex] === null) {
                                    $scope.behaviorAvgInfo[dateIndex].count++;
                                    $scope.behaviorAvgInfo[dateIndex].sum += updatedEntry.behavior;
                                    setNewAvg($scope.avgBehaviorGraph, $scope.behaviorAvgInfo, dateIndex);
                                } else {
                                    $scope.behaviorAvgInfo[dateIndex].sum -= $scope.behaviorGraph.data[index][dateIndex];
                                    $scope.behaviorAvgInfo[dateIndex].sum += updatedEntry.behavior;
                                    setNewAvg($scope.avgBehaviorGraph, $scope.behaviorAvgInfo, dateIndex);
                                }
                            }

                            $scope.behaviorGraph.data[index][dateIndex] = updatedEntry.behavior;
                        }
                        if (type === 'effort') {
                            if (updatedEntry.effort === null) {
                                $scope.effortAvgInfo[dateIndex].count--;
                                $scope.effortAvgInfo[dateIndex].sum -= $scope.effortGraph.data[index][dateIndex];
                                setNewAvg($scope.avgEffortGraph, $scope.effortAvgInfo, dateIndex);
                            } else {
                                if ($scope.effortGraph.data[index][dateIndex] === null) {
                                    $scope.effortAvgInfo[dateIndex].count++;
                                    $scope.effortAvgInfo[dateIndex].sum += updatedEntry.effort;
                                    setNewAvg($scope.avgEffortGraph, $scope.effortAvgInfo, dateIndex);
                                } else {
                                    $scope.effortAvgInfo[dateIndex].sum -= $scope.effortGraph.data[index][dateIndex];
                                    $scope.effortAvgInfo[dateIndex].sum += updatedEntry.effort;
                                    setNewAvg($scope.avgEffortGraph, $scope.effortAvgInfo, dateIndex);
                                }
                            }

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

                            $scope.behaviorAvgInfo[dateIndex].count++;
                            $scope.behaviorAvgInfo[dateIndex].sum += updatedEntry.behavior;
                            setNewAvg($scope.avgBehaviorGraph, $scope.behaviorAvgInfo, dateIndex);
                        }
                        if (type === 'effort') {
                            $scope.effortGraph.data[index][dateIndex] = updatedEntry.effort;

                            $scope.effortAvgInfo[dateIndex].count++;
                            $scope.effortAvgInfo[dateIndex].sum += updatedEntry.effort;
                            setNewAvg($scope.avgEffortGraph, $scope.effortAvgInfo, dateIndex);
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
     * Updates the avgGraph at dateIndex
     * @param {array} avgGraph - graph to be updated
     * @param {array} avgInfoArr - array containing info to calculate the avg
     * @param {number} dateIndex - index to access the arrays
     */
    function setNewAvg(avgGraph, avgInfoArr, dateIndex) {
        var newAvg = avgInfoArr[dateIndex].sum / avgInfoArr[dateIndex].count;
        avgGraph.data[0][dateIndex] = newAvg;
    }

    /**
     * Brings up the report form
     */
    $scope.openReportForm = function() {
        $("#generateReportModal").modal();
        if ($scope.report.class != null) {
            $scope.updateClassGraphs();
        }
    };

    /**
     * Fills individual class graph data with data from the parent graph
     * @param {object} graph - individual class graph
     * @param {object} dataGraph - parent graph
     */
    function fillGraphData(graph, dataGraph) {
        // I can probably get the index of series and apply that to data, actually I don't think I can
        _.each(dataGraph.data[$scope.sectionToDataIndex[$scope.report.class.id]], function(elem) {
            graph.data[0].push(elem);
        });
    }

    /**
     * Updates the class graphs with data from the chosen class
     */
    $scope.updateClassGraphs = function() {
        // this needs to be called on create report button as well
        $scope.showClass = $scope.report.class.title !== "All Classes" && $scope.report.class.title !== "Average";
        if ($scope.showClass) {
            $scope.singleBehaviorGraph.data[0] = [];
            $scope.singleEffortGraph.data[0] = [];
            fillGraphData($scope.singleBehaviorGraph, $scope.behaviorGraph);
            fillGraphData($scope.singleEffortGraph, $scope.effortGraph);
        }
    };

    /**
     * Calculates the sums and counts for the report graphs
     * @param {object} behaviorGraph - the report behavior graph
     * @param {object} effortGraph - the report effort graph
     */
    function setCalcAvgInfo(behaviorGraph, effortGraph) {
        // only display classes that are in this date range...
        $scope.report.length = behaviorGraph.data[0].length;
        for (var i = 0; i < $scope.report.length; i++) {
            for (var j = 0; j < behaviorGraph.data.length; j++) {
                if (behaviorGraph.data[j][i] !== null) {
                    $scope.report.behaviorSum += behaviorGraph.data[j][i];
                    $scope.report.behaviorCount++;
                }
                if (effortGraph.data[j][i] !== null) {
                    $scope.report.effortSum += effortGraph.data[j][i];
                    $scope.report.effortCount++;
                }
            }
        }
    }

    /**
     * Downloads a report pdf
     */
    $scope.generateReport = function() {
        $scope.report.behaviorSum = 0;
        $scope.report.effortSum = 0;
        $scope.report.behaviorCount = 0;
        $scope.report.effortCount = 0;
        $scope.report.length = 0;

        var behaviorCanvas = null;
        var effortCanvas = null;
        var behaviorAvg = "N/A";
        var effortAvg = "N/A";
        var behaviorReportGraph = null;
        var effortReportGraph = null;
        var includeClassNames = false;

        if ($scope.report.class.title === "Average") {
            behaviorCanvas = document.getElementById('report_student_avg_behavior');
            effortCanvas = document.getElementById('report_student_avg_effort');
            behaviorReportGraph = $scope.avgBehaviorGraph;
            effortReportGraph = $scope.avgEffortGraph;

            setCalcAvgInfo($scope.avgBehaviorGraph, $scope.avgEffortGraph);
        } else if ($scope.report.class.title === "All Classes") {
            behaviorCanvas = document.getElementById('report_student_behavior');
            effortCanvas = document.getElementById('report_student_effort');
            behaviorReportGraph = $scope.behaviorGraph;
            effortReportGraph = $scope.effortGraph;
            includeClassNames = true;

            setCalcAvgInfo($scope.behaviorGraph, $scope.effortGraph);
        } else {
            // now create chart..., maybe using ng-hide will work for this? I hate this...
            behaviorCanvas = document.getElementById('report_student_class_behavior');
            effortCanvas = document.getElementById('report_student_class_effort');
            behaviorReportGraph = $scope.singleBehaviorGraph;
            effortReportGraph = $scope.singleEffortGraph;

            setCalcAvgInfo($scope.singleBehaviorGraph, $scope.singleEffortGraph);
        }

        if ($scope.report.behaviorCount > 0) {
            behaviorAvg = Math.round($scope.report.behaviorSum / $scope.report.behaviorCount * 100) / 100 + "";
        }
        if ($scope.report.effortCount > 0) {
            effortAvg = Math.round($scope.report.effortSum / $scope.report.effortCount * 100) / 100 + "";
        }

        var behaviorImgData = behaviorCanvas.toDataURL("image/jpeg", 1.0);
        var effortImgData = effortCanvas.toDataURL("image/jpeg", 1.0);

        var doc = new jsPDF('p', 'pt'); // was mm previous, 1 mm is 2.83465 pt
        var startDate = moment($scope.graphStartDate).format('YYYY-MM-DD').toString();
        var endDate = moment($scope.graphEndDate).format('YYYY-MM-DD').toString();

        // 568x150 (height won't change)
        // About 700 looks to be max for width
        var width = behaviorCanvas.width * 0.26;
        var height = behaviorCanvas.height * 0.26;
        var scale = 2.83465;

        doc.setFontSize(30);
        doc.text(105 * scale, 25 * scale, 'Behavior and Effort Report', 'center');
        doc.setFontSize(18);
        var forMessage = $scope.report.class.title !== "Average" ?
            'For ' + $scope.student.first_name + ' ' + $scope.student.last_name + ' in ' + $scope.report.class.title :
            forMessage = 'For ' + $scope.student.first_name + ' ' + $scope.student.last_name + '\'s Average in All Classes';
        // for person's average in all classes
        doc.text(105 * scale, 33 * scale, forMessage, 'center');
        doc.text(105 * scale, 41 * scale, startDate + " to " + endDate, 'center');
        doc.text(105 * scale, 84 * scale, 'Behavior', 'center');
        doc.text(105 * scale, 92 * scale, 'Average: ' + behaviorAvg, 'center');
        doc.addImage(behaviorImgData, 'JPEG', (105 - width / 2) * scale, 100 * scale, width * scale, height * scale);
        doc.text(105 * scale, 184 * scale, 'Effort', 'center');
        doc.text(105 * scale, 192 * scale, 'Average: ' + effortAvg, 'center');
        doc.addImage(effortImgData, 'JPEG', (105 - width / 2) * scale, 200 * scale, width * scale, height * scale);

        doc.addPage();
        var columns = includeClassNames ? ["Date", "Class", "Behavior Score", "Effort Score"] : ["Date", "Behavior Score", "Effort Score"];
        var rows = [];

        for (var i = 0; i < behaviorReportGraph.data[0].length; i++) {
            // for every class (if there is one)
            for (var j = 0; j < behaviorReportGraph.data.length; j++) {
                var date = $scope.sharedGraph.labels[i]; // actually get date
                var behavior = behaviorReportGraph.data[j][i] === null ? "" : behaviorReportGraph.data[j][i];
                var effort = effortReportGraph.data[j][i] === null ? "" : effortReportGraph.data[j][i];
                if (includeClassNames) {
                    var className = $scope.sharedGraph.series[j];
                    rows.push([date, className, behavior, effort]);
                } else {
                    rows.push([date, behavior, effort]);
                }
            }
        }

        doc.autoTable(columns, rows, { showHeader: 'firstPage' });
        doc.save($scope.student.first_name + $scope.student.last_name + '.pdf');

        // clear report obj
        $scope.report = {};

        // close modal here since data-dismiss isn't working
        $('#generateReportModal').modal('toggle');
    };

    // sets chart backgrounds to white for the reports (default is transparent and it ends up black)
    Chart.plugins.register({
        beforeDraw: function(chartInstance) {
            var ctx = chartInstance.chart.ctx;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
        }
    });

    /**
     * initialization
     */
    updateGraph();
    updateInputScores();
    $scope.average = false;
    $scope.graphDisplayOptions = ["Average", "All Classes"];
    $scope.behaviorGraphSelection = "All Classes";
    $scope.effortGraphSelection = "All Classes";
});
