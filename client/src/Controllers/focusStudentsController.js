app.controller("focusStudentsController", function ($scope, $q, toastService, studentData, focusData,
                                                    userService, testService, behaviorService,
                                                    sectionService, studentService) {
    $scope.studentSearch = {
        text: "",
    };

    // set students if there are any
    $scope.students       = [];
    $scope.studentsLookup = {};
    $scope.focusGraphs    = {};
    if(studentData.students !== null && studentData.students !== undefined) {
        $scope.students       = studentData.students;
        $scope.studentsLookup = _.indexBy(studentData.students, 'id');
    }

    // set focus students if there are any
    $scope.focusStudents = [];
    if(focusData.focus_students !== null && focusData.focus_students !== undefined) {
        $scope.focusStudents = _.sortBy(focusData.focus_students, 'ordering');
    }

    //todo:remove
    console.log($scope.focusStudents);



    $scope.editing = false;
    $scope.toggleEdit = function() {
        $scope.editing = !$scope.editing;
        if($scope.editing === false) {
            $scope.adding = false;
            $scope.studentSearch.text = "";
        }
        $('.collapse').collapse("toggle");
    };

    $scope.adding = false;
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
        // update is called before changes to order of focusStudents are final
        update: function(e, ui) {
            // save the order we had
            tempOrder = [];
            _.each($scope.focusStudents, function(elem) {
                tempOrder.push(elem.id);
            });
        },
        stop: function(e, ui) {
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
            },
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
    $scope.addStudent = function(student) {
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
            },
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
        _.each($scope.focusStudents, function(elem) {
            //create the structure for the graphs array
            $scope.focusGraphs[elem.student] = {}; //todo: go by ID or student?
            $scope.focusGraphs[elem.student]['focus'] = {
                data: [[1, 2, 3, 4],], //todo: real data
                labels: [1, 2, 3, 4], //todo: apply the same fix as the test data for gray lines, by making sure the data is wrapped inside its own array
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

            $scope.focusGraphs[elem.student]['caution'] = {
                data: [1, 2, 3, 4],
                labels: [1, 2, 3, 4],
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
                                //todo: change these to be set later
                            }
                        }]
                    },
                    legend: {
                        display: true
                    }
                },
            };
        });


    }

    $('.sortable').on('mousedown', function () {
        $(this).css('cursor', 'move');
    }).on('mouseup', function () {
        $(this).css('cursor', 'auto');
    });

    updateFocusGraphs();

    //hard code in some values for Guy to test
    $scope.focusGraphs[3]['focus'].data=[[4,3,2,1],[4,1,9,2]];
    $scope.focusGraphs[3]['focus'].labels=[4,3,2,1];

    console.log("The graph data:");
    console.log($scope.focusGraphs);

    //todo: is setting up all the graphs at the very get go a good idea?
});
