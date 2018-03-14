app.controller("profileFocusController", function ($scope, $rootScope, $q, $location, toastService, studentData, focusData, testData,
                                                    userService, testService, behaviorService) {
    $scope.location = $location;

    $scope.editing = false;
    $scope.adding = false;
    $scope.studentSearch = {
        text: "",
    };

    // categories must be populated before setting up students
    // add any static categories here
    $scope.focusCategories = [
        {
            // category gets passed to UpdateFocusGraphs, along with the specificID.
            category: 'behavior',
            displayName: 'Behavior',
            uniqueId: 'behavior',
            href: '/behaviors',
        },
        {
            category: 'effort',
            displayName: 'Effort',
            uniqueId: 'effort',
            href: '/behaviors',
        },
    ];
    // add on dynamic categories
    _.each(testData.standardized_tests, function(elem) {
        $scope.focusCategories.push({ 
            category: 'test', 
            displayName: elem.test_name, 
            specificID: elem.id,
            uniqueId: 'test' + elem.id,
            href: '/tests',
        });
    });


    /*** STUDENTS SETUP & HELPERS ***/

    // set students if there are any
    $scope.students       = [];
    $scope.studentsLookup = {};
    if(studentData.students !== null && studentData.students !== undefined) {
        $scope.students       = studentData.students;
        $scope.studentsLookup = _.indexBy(studentData.students, 'id');
    }

    // set focus students if there are any
    $scope.focusStudents = [];
    if(focusData.focus_students !== null && focusData.focus_students !== undefined) {
        $scope.focusStudents = _.sortBy(focusData.focus_students, 'ordering');
    }

    function defaultFocusCategory() {
        var today = moment();
        var pastWeek = moment(today).subtract(2, 'w');
        return "behavior__"
            + pastWeek.format('YYYY-MM-DD').toString() + "__"
            + today.format('YYYY-MM-DD').toString();
    }

    // set up for focus student must be done everytime new focus student is added to list
    function setUpFocusStudent(focusStudent) {
        if(focusStudent.focus_category === null || focusStudent.focus_category === undefined || focusStudent.focus_category === '' || focusStudent.focus_category === 'none') {
            focusStudent.focus_category = defaultFocusCategory();
        }

        focusStudent.focus_graph = getStarterGraph();
        focusStudent.focus_graph.type = 'focus';
        var focusUniqueId = getUniqueIdForCategory(focusStudent.focus_category);
        focusStudent.focus_graph.category = _.find($scope.focusCategories, function(focusStudent) { return focusStudent.uniqueId === focusUniqueId; });

        focusStudent.progress_graph = getStarterGraph();
        focusStudent.progress_graph.type = 'progress';
        var progressUniqueId = getUniqueIdForCategory(focusStudent.progress_category);
        focusStudent.progress_graph.category = _.find($scope.focusCategories, function(focusStudent) { return focusStudent.uniqueId === progressUniqueId; });

        focusStudent.caution_graph = getStarterGraph();
        focusStudent.caution_graph.type = 'caution';
        var cautionUniqueId = getUniqueIdForCategory(focusStudent.caution_category);
        focusStudent.caution_graph.category = _.find($scope.focusCategories, function(focusStudent) { return focusStudent.uniqueId === cautionUniqueId; });
    }

    //set default focus student info
    _.each($scope.focusStudents, function(elem) {
        setUpFocusStudent(elem);
        updateFocusGraph(elem.student, elem.focus_category, elem.focus_graph);
        updateFocusGraph(elem.student, elem.progress_category, elem.progress_graph);
        updateFocusGraph(elem.student, elem.caution_category, elem.caution_graph);
    });

    /**
     * copies a focus student record. creates a new
     * object that contains a focus student record in 
     * a format that the server will accept.
     */
    function copyFocusStudent(focusStudent) {
        return {
            id: focusStudent.id,
            ordering: focusStudent.ordering,
            student: focusStudent.student,
            user: focusStudent.user,
            focus_category: focusStudent.focus_category,
            progress_category: focusStudent.progress_category,
            caution_category: focusStudent.caution_category,
        };
    }


    /*** CATEGORIES SETUP & HELPERS ***/

    function getUniqueIdForCategory(category) {
        var splitString = category.split('__');
        var type = splitString[0];
        var id = null;
        if(splitString.length > 3) {
            id = parseInt(splitString[3]);
        }

        if(type === 'behavior' || type === 'effort') {
            return type;
        }
        else if(type === 'test') {
            return type + id.toString();
        }
        else {
            return 'unknown';
        }
    }


    /*** GRAPH SETUP & HELPERS ***/

    $scope.graphColors = {
        focus: [
            {
                borderColor: $rootScope.colors[1].setAlpha(0.7).toRgbString(),
                pointBackgroundColor: $rootScope.colors[1].setAlpha(0.7).toRgbString(), 
                backgroundColor: $rootScope.colors[1].setAlpha(0.2).toRgbString(), 
            },
        ],
        progress: [
            {
                borderColor: $rootScope.colors[0].setAlpha(0.7).toRgbString(),
                pointBackgroundColor: $rootScope.colors[0].setAlpha(0.7).toRgbString(), 
                backgroundColor: $rootScope.colors[0].setAlpha(0.2).toRgbString(), 
            },
        ],
        caution: [
            {
                borderColor: tinycolor('#d9534f').setAlpha(0.7).toRgbString(),
                pointBackgroundColor: tinycolor('#d9534f').setAlpha(0.7).toRgbString(), 
                backgroundColor: tinycolor('#d9534f').setAlpha(0.2).toRgbString(), 
            },
        ],
    };


    // returns a new, blank starter graph with all the default options
    function getStarterGraph() {
        return {
            data: [],
            labels: [],
            series: [],
            options: {
                spanGaps: true,
                elements: {
                    point: {
                        radius: 2,
                    },
                    line: {
                        fill: true,
                    },
                },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxes: [{
                        display: true,
                        ticks: {
                            min: 1,
                            max: 5
                        }
                    }]
                },
                legend: {
                    display: true,
                }
            },
            datasetOverride: {
            },
        };
    }


    /*** FOCUS GRAPH HELPERS ***/

    // updates 1 particular graph. makes backend calls to get graph-dependent info
    function updateFocusGraph(studentId, category, graph) {
        var splitString = category.split('__');
        var type = splitString[0];
        var start = splitString[1];
        var end = splitString[2];
        var id = null;
        if(splitString.length > 3) {
            id = parseInt(splitString[3]);
        }
        serviceCaller(graph, type, start, end, studentId, id);
    }

    /**
     * Calls the appropriate service for the category and fills the requested graph
     * @param currentGraph - the graph to update
     * @param category - the category of the graph (test scores, behavior, effort...)
     * @param beginDate - the start date of the data to put into the graph
     * @param endDate - the end date of the data to put into the graph
     * @param studentID - the id of the student
     * @param specificID - an id specific to the graph being requested. Typically something like the class or assignment id
     * */
    function serviceCaller(graph, category, beginDate, endDate, studentId, specificId) {
        var graphStart = moment(beginDate);
        var graphEnd = moment(endDate);

        // calculate how many entries of data our graph will have
        var dateDiff = graphEnd.diff(graphStart, 'd');

        if (category === "behavior" || category === "effort") {
            /**
             * Average Behavior/Effort
             * Needs the student ID
             */
            var config = {
                exclude: ['id', ],
                filter: [
                    { name: 'date.range', val: beginDate, },
                    { name: 'date.range', val: endDate, },
                    { name: 'enrollment.student', val: studentId, },
                ],
                sort: ['date', ],
            };
            behaviorService.getStudentBehavior(config).then(
                function success(data) {
                    // clear labels and data
                    graph.labels = [];
                    graph.data = [];

                    // set series
                    graph.series = category === 'behavior' ? ['Average Behavior', ] : ['Average Effort', ];

                    //set the y-axis bounds
                    graph.options.scales.yAxes[0].ticks.min = 1;
                    graph.options.scales.yAxes[0].ticks.max = 5;

                    // make sure to display the legend
                    graph.options.legend.display = true;

                    // account for weekends
                    graph.options.spanGaps = false;

                    // initialize the arrays with null
                    graph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    graph.labels.push(_.times(dateDiff + 1, _.constant(null)));

                    // iterate through each date, setting data as necessary
                    var iterDate = graphStart.clone();
                    var j = 0;
                    for(var i = 0; i < dateDiff + 1; i++) {
                        graph.labels[i] = iterDate.format('MM/DD').toString();
                        //graph.data[i] = null;

                        if(data.behaviors[j]) {
                            var behaviorDate = moment(data.behaviors[j].date);
                            var average = 0;
                            var count = 0;
                            while(behaviorDate.diff(iterDate, 'd') === 0) {
                                average += data.behaviors[j][category];
                                count++;

                                j++;
                                if(j >= data.behaviors.length) { break; }
                                behaviorDate = moment(data.behaviors[j].date);
                            }
                            if(count > 0) {
                                // have to access at index '0' for chartjs series
                                graph.data[0][i] = average / count;
                            }
                        }
                        iterDate.add(1, 'd');
                    }
                },
                function error(response) {
                    // notify user
                    toastService.error('The server wasn\'t able to get the behaviors for "' + studentsLookup[studentId].first_name + ' ' + studentsLookup[studentId].last_name + '"');
                }
            );
        } else if (category === "test") {
            /**
             * Test scores
             * Uses the specificID for the standardized test id
             */
            var test = _.find(testData.standardized_tests, function(elem) { return elem.id === specificId; });

            var config = {
                filter: [
                    { name: 'student', val: studentId, },
                    { name: 'date.range', val: beginDate, }, 
                    { name: 'date.range', val: endDate, },
                    { name: 'standardized_test', val: specificId, },
                ],
                sort: ['date', ],
            };
            testService.getTestScores(config).then(
                function success(data) {
                    var testScores = data.standardized_test_scores;

                    //set the y-axis bounds
                    graph.options.scales.yAxes[0].ticks.min = test.min_score;
                    graph.options.scales.yAxes[0].ticks.max = test.max_score;

                    // don't need the legend
                    graph.options.legend.display = false;

                    //set the series name to the test name
                    graph.series[0] = test.test_name;

                    //other options for the graph
                    graph.options.scales.xAxes = [{
                        ticks: {
                            autoSkipPadding: 15
                        }
                    }];

                    graph.data   = [];
                    graph.labels = [];
                    graph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    graph.labels.push(_.times(dateDiff + 1, _.constant(null)));

                    // iterate through each date, setting data as necessary
                    var iterDate = graphStart.clone();
                    var j = 0;
                    for(var i = 0; i < dateDiff + 1; i++) {
                        graph.labels[i] = iterDate.format('MM/DD').toString();

                        if(testScores[j]) {
                            var testDate = moment(testScores[j].date);
                            var average = 0;
                            var count = 0;
                            while(testDate.diff(iterDate, 'd') === 0) {
                                average += testScores[j].score;
                                count++;

                                j++;
                                if(j >= testScores.length) { break; }
                                testDate = moment(testScores[j].date);
                            }
                            if(count > 0) {
                                // have to access at index '0' because of chartjs series
                                graph.data[0][i] = average / count;
                            }
                        }
                        iterDate.add(1, 'd');
                    }
                },
                function error(response) {
                    toastService.error('The server wasn\'t able to get test scores for "' + studentsLookup[studentId].first_name + ' ' + studentsLookup[studentId].last_name + '"');
                },
            );
        } else if (category === "grades") {
            console.log("Grades category does not exist yet");
        } else {
            console.error("Requested category of " + category + " does not exist");
        }
    }


    /*** PAGE OPERATIONS ***/

    // toggle for editing
    $scope.toggleEdit = function() {
        $scope.editing = !$scope.editing;
        if($scope.editing === false) {
            $scope.adding = false;
            $scope.studentSearch.text = "";
        }
        $('.collapse').collapse("toggle");
    };

    // toggle for adding
    $scope.toggleAdd = function(val) {
        if(val === null || val === undefined) {
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
    $scope.studentFilter = function(student) {
        if(_.find($scope.focusStudents, function(elem) { return elem.student === student.id; })) {
            return false;
        }
        if($scope.studentSearch.text === null || $scope.studentSearch.text === undefined) {
            return true;
        }
        var input = $scope.studentSearch.text.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if(student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || student.birthdate.toUpperCase().includes(input) ||
            fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }


    // set up for sortable drag/drop
    var tempOrder = [];
    $scope.sortableOptions = {
        start: function(e, ui) {
            // save the order we had
            tempOrder = [];
            _.each($scope.focusStudents, function(elem) {
                tempOrder.push(elem.id);
            });
        },
        stop: function(e, ui) {
            // don't bother the server if nothing actually changed
            if($scope.focusStudents.length === tempOrder.length) {
                var changed = false;
                for(var i = 0; i < $scope.focusStudents.length; ++i) {
                    if($scope.focusStudents[i].id !== tempOrder[i]) {
                        changed = true;
                    }
                }
                if(changed === false) {
                    return;
                }
            }

            // otherwise bother the server
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
        cancel: '.not-sortable',
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
        _.each($scope.focusStudents, function(elem, index) {
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
    $scope.removeFocusStudent = function(focusStudent) {
        userService.deleteFocusForUser(userService.user.id, focusStudent.id).then(
            function success(data) {
                var index = _.findIndex($scope.focusStudents, function(elem) { return elem.id === focusStudent.id; });
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
     * also updates the ordering on all focuses (post successful add)
     *
     * @param {student} student - student to add
     *
     * @return {void}
     */
    $scope.addStudent = function(student) {
        var newFocus = {
            ordering: $scope.focusStudents.length,
            user: userService.user.id,
            student: student.id,
            focus_category: "none", //defaults to "none"
        };

        userService.createFocusForUser(userService.user.id, newFocus).then(
            function success(data) {

                // set up the new student
                setUpFocusStudent(data.focus_student);
                $scope.focusStudents.push(data.focus_student);

                // save the new ordering
                var promises = saveOrder();
                $q.all(promises).then(function(data) {
                    var tempLookup = _.indexBy(_.pluck(data, 'focus_student'), 'id');
                    _.each($scope.focusStudents, function(elem) {
                        elem.ordering = tempLookup[elem.id].ordering;
                    });
                });

                // close add if the user has max focus students
                if($scope.focusStudents.length >= 5) {
                    $scope.toggleAdd(false);
                }

                // update the student's graph
                updateFocusGraph(data.focus_student.student, data.focus_student.focus_category, data.focus_student.focus_graph);
                updateFocusGraph(data.focus_student.student, data.focus_student.progress_category, data.focus_student.progress_graph);
                updateFocusGraph(data.focus_student.student, data.focus_student.caution_category, data.focus_student.caution_graph);
            },
            function error(response) {
                // notify the user
                toastService.error('The server wasn\'t able to save your addition.');
            }
        );
    };

    // this is called when the user selects a different focus category
    // for now, makes the default date range span the past 2 weeks
    // TODO(gzuber): I don't think I shouldn't set dates from here
    $scope.selectFocusCategory = function(focusStudent, category) {
        var toSave = copyFocusStudent(focusStudent);

        var today = moment();
        var pastWeek = moment(today).subtract(2, 'w');

        if (category.category === "behavior") {
            toSave.focus_category = "behavior__"
                + pastWeek.format('YYYY-MM-DD').toString() + "__"
                + today.format('YYYY-MM-DD').toString();
        }
        else if (category.category === "effort") {
            toSave.focus_category = "effort__"
                + pastWeek.format('YYYY-MM-DD').toString() + "__"
                + today.format('YYYY-MM-DD').toString();
        }
        else if (category.category === "test") {
            toSave.focus_category = "test__"
                + pastWeek.format('YYYY-MM-DD').toString() + "__"
                + today.format('YYYY-MM-DD').toString() + "__"
                + category.specificID;
        }

        userService.updateFocusForUser(userService.user.id, toSave.id, toSave).then(
            function success(data) {
                focusStudent.focus_category = data.focus_student.focus_category;

                var uniqueId = getUniqueIdForCategory(focusStudent.focus_category);
                focusStudent.focus_graph.category = _.find($scope.focusCategories, function(elem) { return elem.uniqueId === uniqueId; });

                updateFocusGraph(focusStudent.student, focusStudent.focus_category, focusStudent.focus_graph);
            },
            function error(response) {
                // notify the user
                toastService.error('The server wasn\'t able to save the new "Focus Category."');
            },
        );
    };
});
