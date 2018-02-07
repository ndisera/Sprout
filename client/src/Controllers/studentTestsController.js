app.controller("studentTestsController", function ($scope, $rootScope, $routeParams, testService, studentData) {

    $scope.student = studentData.student;

    $scope.protoGraph = {
        data: [],
        labels: [],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        max: 100, //this will need to change based on the test
                    },
                }],
            },
        },
        colors: [],
        datasetOverride: {
            backgroundColor: [
                "rgba(255,99,132,0.2)",
                "rgba(255,159,64,0.2)",
                "rgba(255,205,86,0.2)",
                "rgba(75,192,192,0.2)",
                "rgba(54,162,235,0.2)",
                "rgba(153,102,255,0.2)",
                "rgba(201,203,207,0.2)",
            ],
            hoverBackgroundColor: [
                "rgba(255,99,132,0.4)",
                "rgba(255,159,64,0.4)",
                "rgba(255,205,86,0.4)",
                "rgba(75,192,192,0.4)",
                "rgba(54,162,235,0.4)",
                "rgba(153,102,255,0.4)",
                "rgba(201,203,207,0.4)",
            ],
            borderColor: [
                "rgba(255,99,132,0.7)",
                "rgba(255,159,64,0.7)",
                "rgba(255,205,86,0.7)",
                "rgba(75,192,192,0.7)",
                "rgba(54,162,235,0.7)",
                "rgba(153,102,255,0.7)",
                "rgba(201,203,207,0.7)",
            ],
        },
    };

    $scope.updateGraphs = function () {

        //Start by getting all of the tests, and mapping test IDs to indexes and names
        var testConfig = {
            //nothing, since we want all of the tests
            //TODO(Guy): Figure out if we need to filter on something here
        };

        testService.getTests(testConfig).then(
          function success(testInfoData) {
              console.log(testInfoData);

              //todo: reset relevant data
              //reset relevant data

              //set up lookups for info and index
              var testIdToIndex = {};
              var testIdToInfo = {}; //name, max, min
              //todo: should I use index or id here?

              var counter = 0; //counter for test id -> index
              _.each(testInfoData.standardized_tests, function (testElem) {
                  //map the id to an index
                  testIdToIndex[testElem.id] = counter;
                  counter++;

                  //map the id to test info
                  testIdToInfo[testElem.id] = { name: testElem.test_name,
                                                       min:  testElem.min_score,
                                                       max:  testElem.max_score };
              });


              //get the student's test scores and start populating the graphs
              var testScoresConfig = {
                  filter: [
                      { name: 'student', val: $scope.student.id }
                  ]
              };

              testService.getTestScores(testScoresConfig).then(
                function success(studentTestScores) {
                    console.log(studentTestScores);

                    //minimal working console prints todo: remove
                    console.log(testIdToIndex);
                    console.log(testIdToInfo);
                }
              )



          }
        )

    };

    $scope.updateGraphs();
});
