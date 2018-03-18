app.controller("studentTestsController", function ($scope, $rootScope, $location, $routeParams, toastService, testService, studentData, testData, termData) {
    $scope.location = $location;

    $scope.student = studentData.student;
    $scope.tests   = [];
    $scope.terms   = [];

    var graphStartDateKey = 'graphStartDate';
    var graphEndDateKey = 'graphEndDate';

    if(testData !== null && testData !== undefined) {
        $scope.tests = testData.standardized_tests;
    }

    if(termData !== null && termData !== undefined && termData.terms !== null && termData.terms !== undefined) {
        $scope.terms = termData.terms;
        _.each($scope.terms, function(elem) {
            elem.start_date = moment(elem.start_date);
            elem.end_date   = moment(elem.end_date);
        });
        // sort so most current first
        $scope.terms = _.sortBy($scope.terms, function(elem) { return -elem.start_date; });
    }

    // find biggest current term
    $scope.selectedTerm = null;
    _.each($scope.terms, function(elem) {
        if(moment() > elem.start_date && moment() < elem.end_date) {
            // I have found a candidate
            // but we want the biggest current term
            if($scope.selectedTerm === null) {
                $scope.selectedTerm = elem;
            }
            else {
                // take the bigger one
                var curDelta = $scope.selectedTerm.end_date - $scope.selectedTerm.start_date;
                var newDelta = elem.end_date - elem.start_date;
                if(newDelta > curDelta) {
                    $scope.selectedTerm = elem;
                }
            }
        }
    });

    // set default date range to range of current term
    if($scope.selectedTerm !== null) {
        $scope[graphStartDateKey] = $scope.selectedTerm.start_date.clone();
        $scope[graphEndDateKey] = $scope.selectedTerm.end_date.clone();
    }
    else {
        // default to the past 4 months
        $scope[graphStartDateKey] = moment();
        $scope[graphEndDateKey] = moment().subtract(4, 'M');
    }

    // prepare tests
    _.each($scope.tests, function(elem) {
        elem.editing = false;
        resetNewScore(elem);

        var borderColor = $rootScope.colors[(elem.id - 1) % $rootScope.colors.length].setAlpha(0.7).toRgbString();
        var backgroundColor = $rootScope.colors[(elem.id - 1) % $rootScope.colors.length].setAlpha(0.2).toRgbString();
        var pointBackgroundColor = $rootScope.colors[(elem.id - 1) % $rootScope.colors.length].setAlpha(0.7).toRgbString();
        elem.graph = {
            data: [],
            labels: [],
            series: [ elem.test_name, ],
            options: {
                elements: {
                    line: {
                        tension: 0.2,
                    },
                },
                responsive: true,
                maintainAspectRatio: false,
                spanGaps: true, 
                scales: {
                    yAxes: [
                        {
                            display: true,
                            ticks: {
                                min: elem.min_score,
                                max: elem.max_score,
                            },
                        }
                    ],
                },
                layout: {
                    padding: {
                        left: 10,
                        top: 5,
                    }
                },
                legend: {
                    display: false
                },
            },
            colors: [
                {
                    borderColor: borderColor,
                    pointBackgroundColor: pointBackgroundColor,
                    backgroundColor: backgroundColor,
                },
            ],
        };
    });

    /**
     * Update one test's graph
     */
    function updateGraph(test) {
        var config = {
            filter: [
                { name: 'student', val: $scope.student.id, },
                { name: 'standardized_test', val: test.id, },
                { name: 'date.range', val: $scope.graphStartDate.format('YYYY-MM-DD').toString(), },
                { name: 'date.range', val: $scope.graphEndDate.format('YYYY-MM-DD').toString(), },
            ],
            sort: ['date', ],
        };

        testService.getTestScores(config).then(
            function success(data) {
                test.scores = data.standardized_test_scores;

                // prepare scores
                _.each(test.scores, function(elem) {
                    elem.editing = false;
                    elem.date    = moment(elem.date);
                    resetScore(elem);
                });
                
                var dateDiff = $scope.graphEndDate.diff($scope.graphStartDate, 'd');

                test.graph.data   = [];
                test.graph.labels = [];
                test.graph.data.push(_.times(dateDiff + 1, _.constant(null)));
                test.graph.labels.push(_.times(dateDiff + 1, _.constant(null)));

                // iterate through each date, setting data as necessary
                var iterDate = $scope.graphStartDate.clone();
                var j = 0;
                for(var i = 0; i < dateDiff + 1; i++) {
                    test.graph.labels[i] = iterDate.format('MM/DD').toString();

                    if(test.scores[j]) {
                        var testDate = moment(test.scores[j].date);
                        var average = 0;
                        var count = 0;
                        while(testDate.diff(iterDate, 'd') === 0) {
                            average += test.scores[j].score;
                            count++;

                            j++;
                            if(j >= test.scores.length) { break; }
                            testDate = moment(test.scores[j].date);
                        }
                        if(count > 0) {
                            // have to access at index '0' because of chartjs series
                            test.graph.data[0][i] = average / count;
                        }
                    }
                    iterDate.add(1, 'd');
                }
            },
            function error(response) {
                toastService.error('The server wasn\'t able to get the requested test scores.');
            },
        );

    }

    /**
     * Updates the graphs on the page
     */
    function updateGraphs() {
        _.each($scope.tests, function(elem) {
            updateGraph(elem);
        });
    }

    function copyScore(score) {
        return {
            id: score.id,
            standardized_test: score.standardized_test,
            student: score.student,
            date: moment(score.date),
            score: score.score,
        };
    }

    function resetNewScore(test) {
        test.newScore = {
            date: moment(),
            score: test.min_score,
        };
    }

    function resetScore(score) {
        score.date_temp  = score.date.clone();
        score.score_temp = score.score;
    }

    $scope.toggleEditTest = function(test, value) {
        test.editing = value;
        if(!value) {
            $scope.toggleAddScore(test, false);
        }
    };

    $scope.toggleAddScore = function(test, value) {
        test.adding = value;
    };

    $scope.toggleEditScore = function(score, value) {
        score.editing = value;
        if(!value) {
            resetScore(score);
        };
    };

    $scope.scoreValidation = function(test, score) {
        if(score.score < test.min_score || score.score > test.max_score) {
            return true;
        }
        return false;
    };

    $scope.scoreEditValidation = function(test, score) {
        if(score.score_temp < test.min_score || score.score_temp > test.max_score) {
            return true;
        }
        return false;
    };

    $scope.saveScore = function(test, score) {
        var newScore = copyScore(score);

        newScore.date  = score.date_temp.format('YYYY-MM-DD').toString();
        newScore.score = score.score_temp;

        testService.updateTestScore(score.id, newScore).then(
            function success(data) {
                updateGraph(test);
            },
            function error(response) {
                toastService.error('The server wasn\'t able to save the test score.');
            },
        );
    };

    $scope.deleteScore = function(test, score) {
        testService.deleteTestScore(score.id).then(
            function success(data) {
                updateGraph(test);
            },
            function error(response) {
                toastService.error('The server wasn\'t able to delete the test score.');
            },
        );
    };

    $scope.addScore = function(test) {
        var newScore = copyScore(test.newScore);

        newScore.date              = newScore.date.format('YYYY-MM-DD').toString();
        newScore.student           = $scope.student.id;
        newScore.standardized_test = test.id;

        testService.addTestScore(newScore).then(
            function success(data) {
                if(test.newScore.date > $scope.graphStartDate && test.newScore.date < $scope.graphEndDate) {
                    updateGraph(test);
                }
                else {
                    toastService.success('Your test score was added successfully. In order to see it, change the date range to include ' + data.standardized_test_score.date + '.');
                }

                if(test.adding) {
                    $scope.toggleAddScore(test, false);
                }
            },
            function error(response) {

            },
        );
    };

    /**
     * called when start or end daterange picker changed
     * updates min/max values of date range, updates graph
     *
     * @param {string} varName - name of datepicker that was change
     * @param {newDate} newDate - new date that was selected
     *
     * @return {void}
     */
    $scope.graphDateRangeChange = function (varName, newDate) {
        // update date
        $scope[varName] = newDate;

        // broadcast event to update min/max values
        if (varName === graphStartDateKey) {
            $scope.$broadcast('pickerUpdate', graphEndDateKey, {minDate: $scope[graphStartDateKey]});
        }
        else if (varName === graphEndDateKey) {
            $scope.$broadcast('pickerUpdate', graphStartDateKey, {maxDate: $scope[graphEndDateKey]});
        }

        updateGraphs();
    };

    updateGraphs();
});
