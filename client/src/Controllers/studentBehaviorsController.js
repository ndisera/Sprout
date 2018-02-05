app.controller("studentBehaviorsController", function ($scope, $rootScope, $routeParams, behaviorService, data) {
    var graphStartDateKey = 'graphStartDate';
    var graphEndDateKey   = 'graphEndDate';

    $scope.inputOptions = [1, 2, 3, 4, 5];

    /**
     * start with default date calculations
     */
    // calculate first and last days of school week
    $scope[graphStartDateKey] = moment().startOf('isoWeek');
    $scope[graphEndDateKey]   = moment().startOf('isoWeek').add(4, 'd');

    // get today
    $scope.inputDate = moment();

    /**
     * set up starting data sets
     */
    // I know this will be here, because I filtered on the student ID, and only that student
    $scope.student = data.students[0];

    // all common behavior/effort graph settings
    $scope.sharedGraph = {
        labels: [],
        series: [],
        options: {
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

    // start off the two graphs with shared settings
    $scope.behaviorGraph = { data: [], };
    $scope.effortGraph   = { data: [], };

    /**
     * initialize everythin using default dates
     */
    updateEnrollmentsSections(data);
    updateGraph();
    updateInputScores();

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

    $scope.inputDateChange = function(varName, newDate) {
        $scope.inputDate = newDate;
        updateInputScores();
    };


    function updateEnrollmentsSections(data) {
        // for now, sort sections alphabetically
        $scope.sections       = _.sortBy(data.sections, 'title');
        $scope.sectionsLookup = _.indexBy(data.sections, 'id');

        // set up lookup for enrollments
        $scope.enrollments           = data.enrollments;
        $scope.enrollmentsLookup     = _.indexBy(data.enrollments, 'id');
        $scope.sectionsToEnrollments = _.indexBy(data.enrollments, 'section');

        // create enrollment-to-index lookup, where order is index into graph data array
        $scope.enrollmentToIndex = {};
        _.each($scope.enrollments, function(enrollmentElem) {
            $scope.enrollmentToIndex[enrollmentElem.id] = _.findIndex($scope.sections, function(sectionElem) { return enrollmentElem.section === sectionElem.id });
        });

        $scope.sharedGraph.series = _.pluck($scope.sections, 'title');

        // update input sections object
        $scope.scoresInput = [];
        _.each($scope.sections, function(elem, index) {
            $scope.scoresInput.push({
                title: elem.title,
                enrollment: $scope.sectionsToEnrollments[elem.id].id,
                id: null,
                behavior: null,
                curBehavior: null,
                effort: null,
                curEffort: null,
                date: null,
            });
        });
    }


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
        }

        behaviorService.getStudentBehavior(config).then(
            function success(data) {
                // check to see if the student is enrolled in more classes, update if so
                //if(_.union(_.pluck($scope.enrollments, 'id'), _.pluck(data.enrollments, 'id')).length !== $scope.enrollments.length) {
                   //updateEnrollmentsSections(data);
                //}

                // calculate how many entries of data our graph will have
                var dateDiff = $scope.graphEndDate.diff($scope.graphStartDate, 'd');

                // clear labels and data
                $scope.sharedGraph.labels = [];

                $scope.behaviorGraph.data = [];
                $scope.effortGraph.data   = [];

                // make sure there are enough arrays for each class, for each day
                _.each($scope.sections, function() {
                    $scope.behaviorGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                    $scope.effortGraph.data.push(_.times(dateDiff + 1, _.constant(null)));
                });

                // iterate through each date, setting data as necessary
                var iterDate = $scope.graphStartDate.clone();
                var j = 0;
                for(var i = 0; i < dateDiff + 1; i++) {
                    $scope.sharedGraph.labels[i] = iterDate.format('MM/DD').toString();

                    var behaviorDate = moment(data.behaviors[j].date);
                    while(behaviorDate.diff(iterDate, 'd') === 0) {
                        if(_.has($scope.enrollmentToIndex, data.behaviors[j].enrollment)) {
                            $scope.behaviorGraph.data[$scope.enrollmentToIndex[data.behaviors[j].enrollment]][i] = data.behaviors[j].behavior;
                            $scope.effortGraph.data[$scope.enrollmentToIndex[data.behaviors[j].enrollment]][i] = data.behaviors[j].effort;
                        }

                        j++;
                        if(j >= data.behaviors.length) { break; }
                        behaviorDate = moment(data.behaviors[j].date);
                    }

                    iterDate.add(1, 'd');
                }
            },
            function error(response) {
                //TODO: notify the user
            }
        );
    }

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
                var newBehaviorsMap = _.indexBy(data.behaviors, 'enrollment');
                _.each($scope.scoresInput, function(elem) {
                    if(_.has(newBehaviorsMap, elem.enrollment)) {
                        var behaviorElem = newBehaviorsMap[elem.enrollment];
                        elem.id          = behaviorElem.id;
                        elem.behavior    = behaviorElem.behavior;
                        elem.curBehavior = behaviorElem.behavior;
                        elem.effort      = behaviorElem.effort;
                        elem.curEffort   = behaviorElem.effort;
                        elem.date        = behaviorElem.date;
                    }
                    else {
                        elem.id          = null;
                        elem.behavior    = null;
                        elem.curBehavior = null;
                        elem.effort      = null;
                        elem.curEffort   = null;
                        elem.date        = $scope.inputDate.format('YYYY-MM-DD').toString();
                    }
                });
                //_.each(data.behaviors, function(behaviorElem, index) {
                    //var score = _.find($scope.scoresInput, function(scoreElem) { return behaviorElem.enrollment === scoreElem.enrollment; });
                    //if(score !== undefined) {
                        //score.id          = behaviorElem.id;
                        //score.behavior    = behaviorElem.behavior;
                        //score.curBehavior = behaviorElem.behavior;
                        //score.effort      = behaviorElem.effort;
                        //score.curEffort   = behaviorElem.effort;
                        //score.date        = behaviorElem.date;
                    //}
                //});
            },
            function error(response) {
                //TODO: notify user
            }
        );
    }


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
                    updatedEntry = data.behavior;

                    entry.behavior    = updatedEntry.behavior;
                    entry.curBehavior = updatedEntry.behavior;
                    entry.effort      = updatedEntry.effort;
                    entry.curEffort   = updatedEntry.effort;

                    // update the graph
                    var entryDate = moment(updatedEntry.date);
                    var startDateDiff = $scope.graphStartDate.diff(entryDate, 'd');
                    var endDateDiff = $scope.graphEndDate.diff(entryDate, 'd');
                    if(startDateDiff <= 0 && endDateDiff >= 0) {
                        var sectionIndex = $scope.enrollmentToIndex[updatedEntry.enrollment];
                        var dateIndex    = Math.abs(startDateDiff);
                        if(type === 'behavior') {
                            $scope.behaviorGraph.data[sectionIndex][dateIndex] = updatedEntry.behavior;
                        }
                        if(type === 'effort') {
                            $scope.effortGraph.data[sectionIndex][dateIndex] = updatedEntry.effort;
                        }
                    }
                },
                function error(response) {

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
                    var startDateDiff = $scope.graphStartDate.diff(entryDate, 'd');
                    var endDateDiff = $scope.graphEndDate.diff(entryDate, 'd');
                    if(startDateDiff <= 0 && endDateDiff >= 0) {
                        var sectionIndex = $scope.enrollmentToIndex[updatedEntry.enrollment];
                        var dateIndex    = Math.abs(startDateDiff);
                        if(type === 'behavior') {
                            $scope.behaviorGraph.data[sectionIndex][dateIndex] = updatedEntry.behavior;
                        }
                        if(type === 'effort') {
                            $scope.effortGraph.data[sectionIndex][dateIndex] = updatedEntry.effort;
                        }
                    }
                },
                function error(response) {

                }
            );
            // post
        }



    }







    //// create initial data structures and graphs
    //$scope.behaviorGraph = {};
    //$scope.effortGraph = {};


    //// set important scope variables
    //$scope.student = student.student;
    //$scope.studentE = Object.assign({}, $scope.student);
    //console.log($scope.student);
    //$scope.section_titles = [];
    //$scope.sections = [];
    //$scope.behaviors = [];
    //// used for experimenting with ng-options
    //$scope.scores = [1, 2, 3, 4, 5];
    //// Both behavior and effort are arrays of lists of scores,
    //// where each top-level array corresponds to a section
    //$scope.hardcodedBehaviorForThePrototype = [];
    //$scope.hardcodedEffortForThePrototype = [];
    //// Section IDs are stored as a list of integers
    //$scope.hardcodedSectionIDsForThePrototype = [];

    //$scope.viewSid = true;
    //$scope.viewSFirstName = true;
    //$scope.viewSLastName = true;
    //$scope.viewSBirthday = true;

    /**
     * Set the active tab and pill based on selection of one or the other
     * @param {string} name - the target of the tab selected.
     */    
    //$scope.setActivePillAndTab = function (name) {
        //switch (name) {
            //case "overview":
                //$('.nav-tabs a[data-target="#overview"]').tab('show');
                //$('.nav-pills a[data-target="#overview"]').tab('show');
                //break;
            //case "tests":
                //$('.nav-tabs a[data-target="#tests"]').tab('show');
                //$('.nav-pills a[data-target="#tests"]').tab('show');
                //break;
            //case "behavior":
                //$('.nav-tabs a[data-target="#behavior"]').tab('show');
                //$('.nav-pills a[data-target="#behavior"]').tab('show');
                //break;
            //case "goals":
                //$('.nav-tabs a[data-target="#goals"]').tab('show');
                //$('.nav-pills a[data-target="#goals"]').tab('show');
                //break;
            //case "services":
                //$('.nav-tabs a[data-target="#services"]').tab('show');
                //$('.nav-pills a[data-target="#services"]').tab('show');
                //break;
            //case "grades":
                //$('.nav-tabs a[data-target="#grades"]').tab('show');
                //$('.nav-pills a[data-target="#grades"]').tab('show');
                //break;
            //default:
        //}
    //}

      //// enrollments will contain section id (for mapping to enrollments) and student id
      //console.log("ENROLLMENTS");
      //console.log(enrollments);
      //$scope.enrollments = enrollments.enrollments;
      //$scope.sections = [];
      //for (var i = 0; i < $scope.enrollments.length; i++) {
        //var sectionPromise = sectionService.getSection($scope.enrollments[i].section);
        //sectionPromise.then(function success(data) {
              //$scope.sections.push({
                //id: data.id,
                //title: data.title
              //});
              //$scope.section_titles.push(
              //data.title
              //);
        //}, function error(message) {
            //$scope.status = message;
          //});
      //}

    //// the sections array should now contain objects with teacher and title

    /**
     * Turns the displayed student field into an editable input.
     * @param {string} field - the name of the field that the user is editing.
     */
    //$scope.editStudent = function (field) {
        //switch (field) {
            //case "sid":
                //$scope.viewSid = false;
                //break;
            //case "firstname":
                //$scope.viewSFirstName = false;
                //break;
            //case "lastname":
                //$scope.viewSLastName = false;
                //break;
            //case "birthday":
                //$scope.viewSBirthday = false;
                //break;
            //default:
        //}
    //};


    /**
     * Updates the selected Student with the newly edited field.
     * @param {string} field - the name of the field that the user is editing.
     */
    //$scope.saveSEdit = function (field) {
        //switch (field) {
            //// update field
            //case "sid":
                //$scope.studentE.student_id = $scope.sId;
                //break;
            //case "firstname":
                //$scope.studentE.first_name = $scope.sFirstName;
                //break;
            //case "lastname":
                //$scope.studentE.last_name = $scope.sLastName;
                //break;
            //case "birthday":
                //$scope.studentE.birthdate = $scope.sBirthday;
                //break;
            //default:
        //}
        //// save with studentE
        //var tempStudent = Object.assign({}, $scope.studentE);
        //delete tempStudent.id;
        //var studentPromise = studentService.updateStudent($scope.studentE.id, tempStudent);
        //studentPromise.then(function success(data) {
            //// set student to studentE to reflect update
            //$scope.student = Object.assign({}, $scope.studentE);
            //// don't have any students field to update
            //switch (field) {
                //// set view after call returns
                //case "sid":
                    //$scope.viewSid = true;
                    //$scope.sId = "";
                    //break;
                //case "firstname":
                    //$scope.viewSFirstName = true;
                    //$scope.sFirstName = "";
                    //break;
                //case "lastname":
                    //$scope.viewSLastName = true;
                    //$scope.sLastName = "";
                    //break;
                //case "birthday":
                    //$scope.viewSBirthday = true;
                    //$scope.sBirthday = "";
                    //break;
                //default:
            //}
        //}, function error(message) {
            //$scope.status = message;
        //});
    //};

    /**
     * Restored the previous display of the selected student field and hides the editable input box.
     * @param {string} field - the name of the field that the user is editing.
     */
    //$scope.cancelSEdit = function (field) {
        //switch (field) {
            //case "sid":
                //$scope.viewSid = true;
                //$scope.sId = "";
                //break;
            //case "firstname":
                //$scope.viewSFirstName = true;
                //$scope.sFirstName = "";
                //break;
            //case "lastname":
                //$scope.viewSLastName = true;
                //$scope.sLastName = "";
                //break;
            //case "birthday":
                //$scope.viewSBirthday = true;
                //$scope.sBirthday = "";
                //break;
            //default:
        //}
    //};

    /**
     * Get behavior/effort scores.
     */
    //$scope.getBehaviors = function () {
        //var config = {
            //filter: [
                //{ name: 'enrollment.student', val: $routeParams.id },
                //{ name: 'date', val: $scope.behaviorDate },
            //],
        //}

        //var behaviorPromise = behaviorService.getStudentBehavior(config);
        //behaviorPromise.then(function success(data) {
            //console.log("BEHAVIORS");
            //console.log(data);
            //$scope.behaviors = data.behaviors;
            //$scope.sectionBehaviorScores = {};
            //for (var i = 0; i < $scope.behaviors.length; i++) {
                //$scope.sectionBehaviorScores[$scope.behaviors[i].enrollment.section] = $scope.behaviors[i];
            //}
            //// now I should be able to match each behavior and effort score to each section
        //}, function error(message) {
            //$scope.status = message;
        //});
    //}
  
    /**
     * Update behavior/effort score
     * @param {number} the section id.
     */
    //$scope.changeBehaviors = function (sectionId) {
        //if ($scope.sectionBehaviorScores === undefined)
            //return;
        //// change my section in scope.sections locally
        ////console.log(newBehavior);
        //var newBehavior = {
            //"date": $scope.behaviorDate,
            //"enrollment": null,
            //"effort": document.getElementById("effort-" + sectionId).value === "" ? null : document.getElementById("effort-" + sectionId).value,
            //"behavior": document.getElementById("behavior-" + sectionId).value === "" ? null : document.getElementById("behavior-" + sectionId).value
        //};

        //if ($scope.sectionBehaviorScores[sectionId] !== undefined && $scope.sectionBehaviorScores[sectionId] !== null) {

            //newBehavior.enrollment = $scope.sectionBehaviorScores[sectionId].enrollment.id;

            //// put if sectionBehaviorScores does contain id
            //var behaviorPromise = behaviorService.updateBehavior($scope.sectionBehaviorScores[sectionId].id, newBehavior);
            //behaviorPromise.then(function success(data) {
                //var enrollment_obj = $scope.sectionBehaviorScores[sectionId].enrollment;
                //$scope.sectionBehaviorScores[sectionId] = data;
                //$scope.sectionBehaviorScores[sectionId].enrollment = enrollment_obj;

                //var date = new Date($scope.behaviorDate);
                //$scope.hardcodedEffortForThePrototype[sectionId - 1][date.getDay()] = $scope.sectionBehaviorScores[sectionId].effort;
                //$scope.hardcodedBehaviorForThePrototype[sectionId - 1][date.getDay()] = $scope.sectionBehaviorScores[sectionId].behavior;
            //}, function error(message) {
                //$scope.status = message;
            //});
            //return;
        //}


        //var enrollment_obj;
        //for (var j = 0; j < $scope.enrollments.length; ++j) {
            //if ($scope.enrollments[j].section === sectionId) {
                //enrollment_obj = $scope.enrollments[j];
                //newBehavior.enrollment = $scope.enrollments[j].id;
            //}
        //}

        //// not contained, make a post, append to list first
        //var behaviorPromise = behaviorService.addBehavior(newBehavior);
        //behaviorPromise.then(function success(data) {
            //$scope.sectionBehaviorScores[sectionId] = data;
            //$scope.sectionBehaviorScores[sectionId].enrollment = enrollment_obj;
        //}, function error(message) {
            //$scope.status = message;
        //});
    //}

    //$('#datepicker').datepicker({
        //format: "yyyy-mm-dd"
    //});

    /**
     * Sets $scope.behaviorDate to the current date in the format "YYYY-MM-DD".
     */
    //function defaultDate() {
        //var date = new Date();
        //// prepend 0 to single digit day
        //var day = "";
        //date.getDate() < 10 ? day = "0" + date.getDate() : day = date.getDate();
        //var month = "";
        //date.getMonth() + 1 < 10 ? month = "0" + (date.getMonth() + 1) : month = date.getMonth() + 1;
        //console.log(day);
        //$scope.behaviorDate = date.getFullYear() + "-" + month + "-" + day;
    //}

    //defaultDate();

    /**
     * Sets $scope.behaviorDate to the newly selected datepicker date
     * and grabs the behavior and effort scores for that date.
     */
    //$scope.changeDate = function () {
        //$scope.behaviorDate = document.getElementById('datepicker').value;
        //$scope.getBehaviors();
    //}

    //// call $scope.changeDate() when datepicker date is changed
    //$('#datepicker').datepicker().on('changeDate', function (ev) {
        //$scope.changeDate();
    //});

    //function getHardcodedPrototypeBehaviorAndEffort() {
        //$scope.hardcodedBehaviorForThePrototype = [];
        //$scope.hardcodedEffortForThePrototype = [];
        //$scope.hardcodedSectionIDsForThePrototype = [];

        //// Use this skeleton as the body of the get
        //var get_data = {
            //"student": $routeParams.id,
            //"start_date": "2017-12-11",
            //"end_date": "2017-12-15"
        //}

        //var config = {
            //filter: [
                //{ name: 'enrollment.student', val: $routeParams.id },
                //{ name: 'date.range', val: "2017-12-11" },
                //{ name: 'date.range', val: "2017-12-15" },
            //],
        //}

        //var behaviorPromise = behaviorService.getStudentBehavior(config);
        //behaviorPromise.then(function success(data) {
            //console.log("BEHAVIORS");
            //console.log(data);
            //var behaviors = {};
            //var efforts = {};
            //var sections = [];
            //for (var index = 0; index < data.length; index++) {
                //var section_id = data.behaviors[index]["enrollment"]["section"];
                //if (behaviors[section_id] == undefined) {
                    //// If we have not started a behavior list for this section, start one now
                    //behaviors[section_id] = [];
                    //efforts[section_id] = [];
                    //sections.push(section_id)
                //}
                //behaviors[section_id].push(data.behaviors[index].behavior);
                //efforts[section_id].push(data.behaviors[index].effort);
            //}

            //// Convert to global arrays
            //for (var index = 0; index < sections.length; index++) {
                //$scope.hardcodedBehaviorForThePrototype.push(behaviors[sections[index]]);
                //$scope.hardcodedEffortForThePrototype.push(efforts[sections[index]]);
            //}

            //console.log($scope.hardcodedEffortForThePrototype);
            //console.log($scope.hardcodedBehaviorForThePrototype);

            //$scope.hardcodedSectionIDsForThePrototype = sections;
        //}, function error(message) {
            //$scope.status = message;
        //});
    //}

    //getHardcodedPrototypeBehaviorAndEffort();

    //$scope.graph_labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    //$scope.onClick = function (points, evt) {
        //console.log(points, evt);
    //};
    //$scope.datasetOverride = [
    //{
        //lineTension: 0.2,

        //label: "CS5510",
        //fill: false,

        //backgroundColor: 'rgba(255,99,132,0.4)',
        //pointBackgroundColor: 'rgba(255,99,132,0.4)',
        //pointHoverBackgroundColor: 'rgba(255,99,132,0.4)',
        //borderColor: 'rgba(255,99,132,1)',
        //pointBorderColor: 'rgba(255,99,132,0.6)',
        //pointHoverBorderColor: 'rgba(255,99,132,1)'
    //},
    //{
        //lineTension: 0.2,

        //label: "CS4400",
        //fill: false,

        //backgroundColor: 'rgba(100,150,255,0.4)',
        //pointBackgroundColor: 'rgba(100,150,255,0.4)',
        //pointHoverBackgroundColor: 'rgba(100,150,255,0.4)',
        //borderColor: 'rgba(100,150,255,1)',
        //pointBorderColor: 'rgba(100,150,255,0.6)',
        //pointHoverBorderColor: 'rgba(100,150,255,1)'
    //}
    //];
    //$scope.options = {
        //responsive: true,
        //maintainAspectRatio: false,
        //scales: {
            //yAxes: [{
                //display: true,
                //ticks: {
                    //min: 1,
                    //stepSize: 1,
                    //max: 5
                //}
            //}]
        //},
        //legend:
        //{
            //display: true
        //}
    //};
});
