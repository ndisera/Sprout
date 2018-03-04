app.controller("focusStudentsController", function ($scope, $q, toastService, studentData, focusData,
                                                    userService, testService, behaviorService,
                                                    sectionService, studentService) {
    $scope.studentSearch = {
        text: "",
    };

    // set students if there are any
    $scope.students = [];
    $scope.studentsLookup = {}; //studentsLookup not used at all
    $scope.focusGraphs = {};
    if (studentData.students !== null && studentData.students !== undefined) {
        $scope.students = studentData.students;
        $scope.studentsLookup = _.indexBy(studentData.students, 'id');
    }

    // set focus students if there are any
    $scope.focusStudents = [];
    if (focusData.focus_students !== null && focusData.focus_students !== undefined) {
        $scope.focusStudents = _.sortBy(focusData.focus_students, 'ordering');
    }

    //todo:remove
    console.log($scope.focusStudents);


    $scope.editing = false;
    $scope.toggleEdit = function () {
        $scope.editing = !$scope.editing;
        if($scope.editing === false) {
            $scope.adding = false;
            $scope.studentSearch.text = "";
        }
        $('.collapse').collapse("toggle");
    };

    $scope.adding = false;
    $scope.toggleAdd = function (val) {
        if (val === null || val === undefined) {
            $scope.adding = !$scope.adding;
        }
        else {
            $scope.adding = val;
        }
        $scope.studentSearch.text = "";

    };

    /**
     * Filter used for students
     * @param {student} student - student to be filtered.
     */
    $scope.studentFilter = function (student) {
        if (_.find($scope.focusStudents, function (elem) {
              return elem.student === student.id;
          })) {
            return false;
        }
        if($scope.studentSearch.text === null || $scope.studentSearch.text === undefined) {
            return true;
        }
        var input = $scope.studentSearch.text.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if (student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
          student.last_name.toUpperCase().includes(input) || student.birthdate.toUpperCase().includes(input) ||
          fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }


    // set up for sortable drag/drop
    var tempOrder = [];
    $scope.sortableOptions = {
        // update is called before changes to order of focusStudents are final
        update: function (e, ui) {
            // save the order we had
            tempOrder = [];
            _.each($scope.focusStudents, function (elem) {
                tempOrder.push(elem.id);
            });
        },
        stop: function (e, ui) {
            var promises = saveOrder();
            $q.all(promises)
                .then(function(data) {
                    // save the ordering values to focusStudents (make it final)
                    var tempLookup = _.indexBy(_.pluck(data, 'focus_student'), 'id');
                    _.each($scope.focusStudents, function(elem) {
                        elem.ordering = tempLookup[elem.id].ordering;
                    });

                    toastService.success('The server saved your order');
                })
                .catch(function(data) {
                    // revert the order using tempOrder saved in "update" call
                    var tempFocusStudents = [];
                    _.each(tempOrder, function(elem) {
                        tempFocusStudents.push(_.find($scope.focusStudents, function(e) { return e.id === elem; }));
                    });
                    $scope.focusStudents = tempFocusStudents;

                    // notify the user
                    toastService.error('The server wasn\'t able to save your reordering.');
                });
        },
    };

    /***
     * Save the order of focusStudents
     * Will make calls to the server so that each records
     * 'ordering' reflects the index of the focusStudents array.
     *
     * @return {array}{promise} array of promises that indicate every
     *                              server call has returned
     */
    function saveOrder() {
        var promises = [];
        _.each($scope.focusStudents, function (elem, index) {
            var editedFocusStudent = _.clone(elem);
            editedFocusStudent.ordering = index;
            promises.push(userService.updateFocusForUser(userService.user.id, elem.id, editedFocusStudent));
        });
        return promises;
    }

    /***
     * removes a student from this user's focuses
     * also updates the ordering on remaining focuses
     *
     * @param {focus} focusStudent - record to delete
     *
     * @return {void}
     */
    $scope.removeFocusStudent = function (focusStudent) {
        userService.deleteFocusForUser(userService.user.id, focusStudent.id).then(
          function success(data) {
              var index = _.findIndex($scope.focusStudents, function (elem) {
                  return elem.id === focusStudent.id;
              });
              $scope.focusStudents.splice(index, 1);

                var promises = saveOrder();
                $q.all(promises).then(function(data) {
                    var tempLookup = _.indexBy(_.pluck(data, 'focus_student'), 'id');
                    _.each($scope.focusStudents, function(elem) {
                        elem.ordering = tempLookup[elem.id].ordering;
                    });
                });
            },
            function error(response) {
                // notify the user
                toastService.error('The server wasn\'t able to save your removal.');
            }
        );
    };

    /***
     * adds a student to this user's focuses
     * also updates the ordering on all focuses (post-add)
     *
     * @param {student} student - student to add
     *
     * @return {void}
     */
    $scope.addStudent = function (student) {
        var newFocus = {
            ordering: $scope.focusStudents.length,
            user: userService.user.id,
            student: student.id,
            focus_category: "none", //todo: add user selectable focus category
        };

        userService.createFocusForUser(userService.user.id, newFocus).then(
          function success(data) {
              $scope.focusStudents.push(data['focus_student']);

                var promises = saveOrder();
                $q.all(promises).then(function(data) {
                    var tempLookup = _.indexBy(_.pluck(data, 'focus_student'), 'id');
                    _.each($scope.focusStudents, function(elem) {
                        elem.ordering = tempLookup[elem.id].ordering;
                    });
                });
            },
            function error(response) {
                // notify the user
                toastService.error('The server wasn\'t able to save your addition.');
            }
        );

        console.log("focus student data:");
        console.log($scope.focusStudents);
    };

    /**
     * Get all of the data needed for the focus student graphs
     * Insert that data into the $scope.focusStudentsGraph dictionary at ['studentID']['category']
     */

    function updateFocusGraphs() {


        //for each focus student, create the three displayed graphs
        _.each($scope.focusStudents, function (elem) {
            //create the structure for the graphs array
            $scope.focusGraphs[elem.student] = {};
            $scope.focusGraphs[elem.student]['focus'] = {
                data: [],
                labels: [],
                series: [],
                category: 'derp', //todo: remove. This is mainly for testing to make sure that it got generated
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
                                //todo: change these to be set later
                            }
                        }]
                    },
                    legend: {
                        display: true
                    }
                },
            };

            $scope.focusGraphs[elem.student]['progress'] = {
                data: [1, 2, 3, 4],
                labels: [1, 2, 3, 4],
                series: [],
                category: 'derp', //todo: remove. This is mainly for testing to make sure that it got generated
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
                    legend: {
                        display: true
                    }
                },
            };

            $scope.focusGraphs[elem.student]['caution'] = {
                data: [1, 2, 3, 4],
                labels: [1, 2, 3, 4],
                series: [],
                category: 'derp', //todo: remove. This is mainly for testing to make sure that it got generated
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
                    legend: {
                        display: true
                    }
                },
            };

            //With the graph framework set up, now we call services to get the data we need
            //todo: use the category passed in from the backend instead of "month behavior", "week behavior", "week effort"

            //Focus Graph
            //temporarily getting a month of behavior
            serviceCaller($scope.focusGraphs[elem.student]['focus'], "behavior", "2018-01-01", "2018-02-01", elem.student, 23, "extra shit");
            serviceCaller($scope.focusGraphs[elem.student]['progress'], "effort", "2018-01-01", "2018-02-01", elem.student, 24, "extra shit");

            console.log("focus graph:");
            console.log($scope.focusGraphs[elem.student]['focus']);
            console.log("progress graph:");
            console.log($scope.focusGraphs[elem.student]['progress']);
            console.log("caution graph:");
            console.log($scope.focusGraphs[elem.student]['caution']);
        });
    }

    /**
     * Calls the appropriate service for the category and fills the requested graph
     * @param currentGraph - the graph to update
     * @param category - the category of the graph (test scores, behavior, effort...)
     * @param beginDate - the start date of the data to put into the graph
     * @param endDate - the end date of the data to put into the graph
     * @param studentID - the id of the student
     * @param specificID - an id specific to the graph being requested. Typically something like the class or assignment id
     * @param extraParameters - extra parameters needed to generate a specific graph. Ignored if not needed

     * */
    function serviceCaller(currentGraph, category, beginDate, endDate, studentID, specificID, extraParameters) {

        // todo: possible feature: pass along the days that were troublesome so we can highlight them in the graph
        //  the caution graph is already red though...


        // category_start-date_end-date_...(stuff)
        // ...
        //  behavior
        //      class id
        //  effort
        //      class id
        //  Test Scores
        //      test id
        //      maybe a surrounding date range to narrow it down?
        //  grades
        //      assignment id

        var behaviorAndEffortConfig = {
            include: ['enrollment.section.*',],
            exclude: ['id',],
            filter: [
                {name: 'date.range', val: beginDate,},
                {name: 'date.range', val: endDate,},
                {name: 'enrollment.student', val: studentID,},
            ],
            sort: ['date',],
        };

        var graphStart = moment(beginDate);
        var graphEnd = moment(endDate);
        //todo: set chartjs type of graph depending on the type of graph displayed
        if (category === "behavior" || category === "effort") {
            /**
             * Behavior/Effort
             */
            behaviorService.getStudentBehavior(behaviorAndEffortConfig).then(
              function success(data) {
                  // clear labels and data
                  currentGraph.labels = [];
                  currentGraph.data = [];

                  // calculate how many entries of data our graph will have
                  var dateDiff = graphEnd.diff(graphStart, 'd');

                  // there's only one class to worry about for behavior, which we have the ID for
                  // initialize the arrays with null for chartjs
                  currentGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                  currentGraph.labels.push(_.times(dateDiff + 1, _.constant(null)));


                  // console log to get the data we're working with
                  console.log("service call data");
                  console.log(data);
                  // This is the data we have
                  //     {enrollments: Array(1), behaviors: Array(19), sections: Array(1)}
                  //     behaviors: Array(19)
                  //     0:
                  //        {date: "2018-01-08", enrollment: 24, effort: 4, behavior: 4}
                  //     1:
                  //        {date: "2018-01-09", enrollment: 24, effort: 2, behavior: 1}
                  //     2:
                  //        {date: "2018-01-10", enrollment: 24, effort: 1, behavior: 3}
                  //     ...(19 of them for this example student)
                  //
                  //     enrollments: Array(1)
                  //     0:
                  //        {section: 10, id: 24, student: 12}
                  //
                  //     sections: Array(1)
                  //     0:
                  //        {id: 10, schedule_position: 1, teacher: 3, term: 2, title: "English 4945"}

                  var i;
                  //Set the data points
                  for (i = 0; i < data.behaviors.length; i++) {
                      //iterate through each datapoint, calculate the date difference, and place data at that index

                      //filter on the specificID. In this case, the enrollment ID
                      if (data.behaviors[i].enrollment === specificID) {
                          var pointDate = moment(data.behaviors[i].date);
                          var pointIndex = pointDate.diff(graphStart, 'd');
                          if (category === "behavior") {
                              currentGraph.data[0][pointIndex] = data.behaviors[i].behavior;
                          } else { //category === "effort"
                              currentGraph.data[0][pointIndex] = data.behaviors[i].effort;
                          }
                      }
                  }

                  //Set the labels
                  var iterDate = graphStart.clone();
                  for (i = 0; i < dateDiff + 1; i++) {
                      currentGraph.labels[i] = iterDate.format('MM/DD').toString();
                      iterDate.add(1, 'd');
                  }
                  //Set the line label
                  //Grab the section id from the enrollments array
                  var sectionID;
                  for (i = 0; i < data.enrollments.length; i++) {
                      if(data.enrollments[i].id === specificID) {
                          sectionID = data.enrollments[i].section;
                          break;
                      }
                  }
                  var sectionTitle;
                  for (i = 0; i < data.sections.length; i++) {
                      if(data.sections[i].id === sectionID) {
                          sectionTitle = data.sections[i].title;
                          break;
                      }
                  }
                  currentGraph.series[0] = sectionTitle;

                  //Set the category label (capitalized)
                  currentGraph.category = category[0].toUpperCase() + category.slice(1);
              },
              function error(response) {
                  //TODO: notify user hopefully only once
                  toastService.error('The server wasn\'t able to get the behavior for focus students.');
              }
            );
        } //else if...
    }


    $('.sortable').on('mousedown', function () {
        $(this).css('cursor', 'move');
    }).on('mouseup', function () {
        $(this).css('cursor', 'auto');
    });

    updateFocusGraphs();

    //todo: remove
    console.log("The graph data:");
    console.log($scope.focusGraphs);

    //todo: is setting up all the graphs at the very get go a good idea?
});


