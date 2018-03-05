app.controller("studentGradesController", function ($scope, $rootScope, $location, $routeParams, toastService, sectionService, studentService, studentData, termData, enrollmentData) {
    $scope.location = $location;
    $scope.student  = studentData.student;

    $scope.sections = [];
    $scope.selectedSection = {};


    if(termData.terms !== null && termData.terms !== undefined) {
        $scope.terms = termData.terms;
        _.each($scope.terms, function(elem) {
            elem.start_date = moment(elem.start_date);
            elem.end_date   = moment(elem.end_date);
        });
        // sort so most current first
        $scope.terms = _.sortBy($scope.terms, function(elem) { return -elem.start_date; });
    }

    if(enrollmentData.sections !== null && enrollmentData.sections !== undefined) {
        $scope.sections = _.sortBy(enrollmentData.sections, 'schedule_position');
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

    // if we're between terms (over break)
    if($scope.selectedTerm === null) {
        $scope.selectedTerm = $scope.terms[0];
    }



    $scope.assignmentsGraph = {
        data: [],
        labels: [],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        max: 100,
                        min: 0,
                    },
                }],
                xAxes: [{
                    maxBarThickness: 70,
                }],
            },
        },
        datasetOverride: {
            backgroundColor: [],
            hoverBackgroundColor: [],
            borderColor: [],
        },
    };

    $scope.ontimeIndex  = 0;
    $scope.lateIndex    = 1;
    $scope.missingIndex = 2;
    $scope.completionGraph = {
        data: [0, 0, 0,],
        labels: ["On-Time", "Late", "Missing",],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: true,
                position: 'bottom',
            },
        },
        datasetOverride: {
            backgroundColor: _.map($rootScope.colors, function(elem) { return elem.setAlpha(0.2).toRgbString(); }),
            hoverBackgroundColor: _.map($rootScope.colors, function(elem) { return elem.setAlpha(0.4).toRgbString(); }),
            borderColor: _.map($rootScope.colors, function(elem) { return elem.setAlpha(0.7).toRgbString(); }),
        },
    };

    $scope.selectSection = function(section) {

        var assignmentConfig = { //todo: not used
            filter: [
                { name: 'section', val: section.id, },
            ],
        };

        sectionService.getAssignmentsForSection(section.id).then(
            function success(data) {

                $scope.selectedSection = section;

                if(data.assignments.length === 0) {
                    $scope.noAssignments = true;
                    $scope.assignments = [];
                    $scope.upcomingAssignments = [];
                    $scope.missingAssignments = [];
                    return;
                }
                $scope.noAssignments = false;
                $scope.assignments = _.sortBy(data.assignments, function(elem) { return moment(elem.due_date); });

                // Save off the upcoming assignments, then remove them from our current assignments list
                $scope.upcomingAssignments = _.filter($scope.assignments, function(elem) { return (moment(elem.due_date).diff(moment(), 'days')) >= 0; });
                $scope.assignments         = _.filter($scope.assignments, function(elem) { return (moment(elem.due_date).diff(moment(), 'days')) < 0; });

                // make sure there are enough colors for every assignment in assignment graph
                var backgroundColors      = [];
                var hoverBackgroundColors = [];
                var borderColors          = [];
                for(var i = 0; i < $scope.assignments.length; i += $rootScope.colors.length) {
                    backgroundColors.push(_.map($rootScope.colors, function(elem) { return elem.setAlpha(0.2).toRgbString(); }));
                    hoverBackgroundColors.push(_.map($rootScope.colors, function(elem) { return elem.setAlpha(0.4).toRgbString(); }));
                    borderColors.push(_.map($rootScope.colors, function(elem) { return elem.setAlpha(0.7).toRgbString(); }));
                }
                $scope.assignmentsGraph.datasetOverride.backgroundColor      = _.flatten(backgroundColors);
                $scope.assignmentsGraph.datasetOverride.hoverBackgroundColor = _.flatten(hoverBackgroundColors);
                $scope.assignmentsGraph.datasetOverride.borderColor          = _.flatten(borderColors);

                // Save the upcoming assignment due dates
                _.each($scope.upcomingAssignments, function(assignmentElem) {
                    assignmentElem.due_date = moment(assignmentElem.due_date);
                });
                
                // get all the grades for this class
                var gradesConfig = {
                    filter: [
                        { name: 'assignment.section', val: section.id, },
                    ],
                };

                studentService.getGradesForStudent($scope.student.id, gradesConfig).then(
                    function success(data) {

                        // reset relevant data
                        $scope.classGrade              = 0;
                        $scope.completionGraph.data    = [0,0,0,];
                        $scope.assignmentsGraph.labels = [];
                        $scope.assignmentsGraph.data   = [];
                        $scope.missingAssignments      = [];

                        $scope.grades              = data.grades;
                        $scope.assignmentsToGrades = {};

                        _.each($scope.assignments, function(assignmentElem) {
                            // sort grades for assignment by date turned in
                            var gradesForAssignment       = _.where($scope.grades, { assignment: assignmentElem.id, });
                            var sortedGradesForAssignment = _.sortBy(gradesForAssignment, function(elem) { return moment(elem.handin_datetime); });

                            assignmentElem.due_date = moment(assignmentElem.due_date);

                            // create lookup for grade on assignment, update completion graph with ontime/late/missing
                            //TODO(gzuber): if there are multiple grades, make sure the latest one isn't late?
                            if(sortedGradesForAssignment.length > 0) {
                                var gradeForAssignment = sortedGradesForAssignment[sortedGradesForAssignment.length - 1];
                                $scope.assignmentsToGrades[assignmentElem.id] = gradeForAssignment.score;

                                // was it on time?
                                var handin  = moment(gradeForAssignment.handin_datetime);
                                if(assignmentElem.due_date.diff(handin, 'm') > 0) {
                                    // on time
                                    $scope.completionGraph.data[$scope.ontimeIndex]++;
                                }
                                else {
                                    // late
                                    $scope.completionGraph.data[$scope.lateIndex]++;
                                }
                            }
                            else {
                                // missing
                                $scope.completionGraph.data[$scope.missingIndex]++;
                                $scope.missingAssignments.push(assignmentElem);
                            }
                        });

                        // build data by iterating assignments
                        _.each($scope.assignments, function(assignmentElem) {
                            $scope.assignmentsGraph.labels.push(assignmentElem.assignment_name);

                            // see if student has grade for assignment, 0 otherwise
                            var gradeForAssignment = 0;
                            if(_.has($scope.assignmentsToGrades, assignmentElem.id)) {
                                gradeForAssignment = $scope.assignmentsToGrades[assignmentElem.id];
                            }
                            // calculate percentage on assignment and update overall class grade
                            var percentage = 100 * (gradeForAssignment - assignmentElem.score_min) / (assignmentElem.score_max - assignmentElem.score_min);
                            $scope.assignmentsGraph.data.push(percentage);
                            $scope.classGrade += percentage;
                        });

                        // calculate final class grade
                        $scope.classGrade /= $scope.assignments.length;
                        $scope.classGrade = $scope.classGrade.toString().slice(0, _.indexOf($scope.classGrade.toString(), '.') + 3);

                    },
                    function error(response) {
                        toastService.error('The server wasn\'t able to get the student\'s grades for this class.');
                    }
                );
            },
            function error(response) {
                //TODO: notify user
                toastService.error('The server wasn\'t able to get the assignments for this class.');
            }
        );
    };

    $scope.selectTerm = function(term) {
        $scope.selectedTerm = term;
        var sectionsInTerm = _.filter($scope.sections, function(elem) { return elem.term === term.id; });
        if(sectionsInTerm.length === 0) {
            $scope.selectedSection = null;
        }
        else {
            $scope.selectSection(sectionsInTerm[0]);
        }
    };



    $scope.selectTerm($scope.selectedTerm);

});
