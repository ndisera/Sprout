app.controller("studentTestsController", function ($scope, $rootScope, $routeParams, testService, studentData) {

    $scope.student = studentData.student;

    $scope.protoGraph = {
        data: [],
        labels: [],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            spanGaps: true, //skip values of null or NaN
            scales: {
                yAxes: [{
                    ticks: {
                        min: 0,
                        max: 100
                        //this will change based on the test
                    },
                }],
            },
            elements: {
                line: {
                    fill: false,
                },
            },

            title: {
                display: true,
                text: ''
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
        //
    };

    $scope.testGraphs = {};

    var graphStartDateKey = 'graphStartDate';
    var graphEndDateKey = 'graphEndDate';

    $scope[graphStartDateKey] = moment().startOf('year');
    $scope[graphEndDateKey] = moment().startOf('year').add(6, 'months');

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

        updateGraphs();
    };

    /**
     * Updates the graphs on the page
     */
    function updateGraphs() {

        //Start by getting all of the tests, and mapping test IDs to indexes and names
        var testConfig = {
            //nothing, since we want all of the tests
            //TODO(Guy): Figure out if we need to filter on something here
            //maybe filter on tests that the student has taken
        };

        testService.getTests(testConfig).then(
          function success(testInfoData) {
              console.log(testInfoData);

              //set up lookups for info
              var testIdToInfo = {}; //name, max, min

              _.each(testInfoData.standardized_tests, function (testElem) {
                  //map the id to an index

                  //map the id to test info
                  testIdToInfo[testElem.id] = {
                      name: testElem.test_name,
                      min: testElem.min_score,
                      max: testElem.max_score
                  };
              });


              var testScoresConfig = {
                  filter: [
                      //get the student's test scores and start populating the graphs,
                      {name: 'student', val: $scope.student.id},
                      {name: 'date.range', val: $scope.graphStartDate.format('YYYY-MM-DD').toString(),},
                      {name: 'date.range', val: $scope.graphEndDate.format('YYYY-MM-DD').toString(),},
                  ]
              };

              testService.getTestScores(testScoresConfig).then(
                function success(studentTestScoresRaw) {
                    // console.log(studentTestScoresRaw);

                    var studentTestScores = _.sortBy(studentTestScoresRaw.standardized_test_scores, 'date');

                    // console.log(testIdToInfo);

                    //two passes for now: could be optimized to 1 pass if we wanted to
                    var testIdToIndex = {};
                    var counter = 0; //counter for test id -> index
                    var startDate = moment($scope[graphStartDateKey]);
                    var endDate = moment($scope[graphEndDateKey]);
                    var dateDiff = endDate.diff(startDate, 'd');
                    var protoDataArray;
                    var protoLabelsArray;

                    _.each(studentTestScores, function (scoreElem) {
                        if (!(_.has(testIdToIndex, scoreElem.standardized_test))) {
                            //store the ID -> index pair
                            testIdToIndex[scoreElem.standardized_test] = counter;

                            //create a new graph data object
                            $scope.testGraphs[counter] = {

                                data: [],
                                labels: [],
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    spanGaps: true, //skip values of null or NaN

                                    scales: {
                                        yAxes: [{
                                            ticks: {
                                                //this will change based on the test
                                                min: testIdToInfo[scoreElem.standardized_test].min,
                                                max: testIdToInfo[scoreElem.standardized_test].max,
                                            },
                                        }],
                                        xAxes: [{
                                            ticks: {
                                                //specify more space around each label
                                                autoSkipPadding : 20
                                            },
                                        }],
                                    },

                                    title: {
                                        display: true,
                                        text: testIdToInfo[scoreElem.standardized_test].name
                                    }
                                },


                            };


                            //initialize the array
                            protoDataArray = [];
                            protoDataArray = _.times(dateDiff + 1, _.constant(null));
                            // protoDataArray = _.times(dateDiff + 1, _.constant(4));
                            $scope.testGraphs[counter].data = protoDataArray;

                            //make a labels array in order to display our data
                            protoLabelsArray = [];
                            protoLabelsArray = _.times(dateDiff + 1, _.constant(null));
                            $scope.testGraphs[counter].labels = protoLabelsArray;

                            //todo: test edge case of max

                            counter++;
                        }

                    });

                    //todo: combine: we could be generating an empty graph if the only tests are outside our date range
                    // the only thing is, I need the testIdToIndex to be already generated.... maybe.
                    //   I think that for any score, it will at the minimum be put into the lookup array
                    //   right before it's needed


                    //todo: check:
                    // initialize the data array


                    // put in existing scores
                    _.each(studentTestScores, function (scoreElem) {
                        //for each score, calculate the number of days since the start date
                        var currentDate = moment(scoreElem.date);
                        var dateIndex = currentDate.diff(startDate, 'days');

                        //use the test ID to put it into the right graph
                        $scope.testGraphs[testIdToIndex[scoreElem.standardized_test]].data[dateIndex] = scoreElem.score;

                    });

                    //put in all labels
                    _.each($scope.testGraphs, function (graphElem) {
                        var iterDate = $scope.graphStartDate.clone();
                        for (var i = 0; i < dateDiff + 1; i++) {
                            graphElem.labels[i] = iterDate.format('MM/DD').toString();
                            iterDate.add(1, 'd');
                        }

                        // console.log(graphElem);
                    })


                }
              )


          }
        )

    };

    /**
     * called when input datepicker is changed
     * updates the input date and all relevant scores
     *
     * @param {string} varName - name of picker that was changed
     * @param {newDate} newDate - new date that was selected
     *
     * @return {void}
     */
    $scope.inputDateChange = function(varName, newDate) {
        $scope.inputDate = newDate;
        updateI ();
    };

    updateGraphs();
});
