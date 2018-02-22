app.controller("focusStudentsController", function ($scope, $q, studentData, focusData, userService) {

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

    $scope.editing = false;
    $scope.toggleEdit = function() {
        $scope.editing = !$scope.editing;
        if($scope.editing === true) {
            $scope.adding = false;
        }
    };

    $scope.adding = false;
    $scope.toggleAdd = function(val) {
        if(val === null || val === undefined) {
            $scope.adding = !$scope.adding;
        }
        else {
            $scope.adding = val;
        }
    };

    /**
     * Filter used for students
     * @param {student} student - student to be filtered.
     */
    $scope.studentFilter = function(student) {
        if(_.find($scope.focusStudents, function(elem) { return elem.student === student.id; })) {
            return false;
        }
        if($scope.studentSearch === null || $scope.studentSearch === undefined) {
            return true;
        }
        var input = $scope.studentSearch.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if(student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || student.birthdate.toUpperCase().includes(input) ||
            fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }


    // set up for sotrable drag/drop
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
                })
                .catch(function(data) {
                    // revert the order using tempOrder saved in "update" call
                    var tempFocusStudents = [];
                    _.each(tempOrder, function(elem) {
                        tempFocusStudents.push(_.find($scope.focusStudents, function(e) { return e.id === elem; }));
                    });
                    $scope.focusStudents = tempFocusStudents;

                    //TODO(gzuber): nofity user
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
                //TODO(gzuber): notify the user
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
            focus_category: "none",
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

                $scope.adding = false;
            },
            function error(response) {
                //TODO(gzuber): notify the user
            },
        );
    };



    // All of the following belongs to the hard-coded angular-charts on the Focus Students page
    $scope.focus_labels = ["January", "February", "March", "April", "May", "June", "July"];
    $scope.focus_data = [
    [28, 48, 40, 19, 86, 27, 90]
    ];
    $scope.progress_labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    $scope.progress_data = [
    [2, 3, 3, 4, 5]
    ];
    $scope.progress_colours = ["rgba(80,255,80,1)"]
    $scope.caution_labels = ["Math", "Reading", "Music", "History", "Spanish"];
    $scope.caution_data = [
    [77, 81, 66, 50, 35]
    ];
    $scope.caution_colours = [
      "rgba(255,99,132,1)"
    ];
    $scope.onClick = function (points, evt) {
      console.log(points, evt);
    };
    $scope.options = {
      responsive: true,
      maintainAspectRatio: false
    };
    $scope.options_behavior = {
      responsive: true,
      maintainAspectRatio: false,
      scales:{
        yAxes: [{
          display: true,
          ticks: {
            min: 1,
            max: 5
          }
        }]
      }
    };







    $('.sortable').on('mousedown', function () {
        $(this).css('cursor', 'move');
    }).on('mouseup', function () {
        $(this).css('cursor', 'auto');
    });
});
