app.controller("studentGradesController", function ($scope, $rootScope, $location, $routeParams, toastService, sectionService, studentService, termService, studentData, termData, enrollmentData) {
    $scope.location = $location;
    $scope.student  = studentData.student;

    $scope.sections = [];
    $scope.selectedSection = {};

    $scope.terms           = [];
    $scope.selectedTerm    = null;
    var currentTerms       = [];
    var currentTermsLookup = {};

    if(termData.terms !== null && termData.terms !== undefined) {
        $scope.terms = termService.transformAndSortTerms(termData.terms);
        currentTerms = termService.getAllCurrentTerms(termData.terms);

        // set up an option for all current terms
        if(currentTerms.length > 0) {
            // create special term for all current terms
            $scope.terms.unshift({ id: -1, name: 'All Current Terms', });
            currentTermsLookup = _.indexBy(currentTerms, 'id');
        }

        // select a term
        $scope.selectedTerm = $scope.terms[0];
    }

    if(enrollmentData.sections !== null && enrollmentData.sections !== undefined) {
        $scope.sections = _.sortBy(enrollmentData.sections, 'schedule_position');
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
                    display: false,
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
                    $scope.assignments = [];
                    $scope.upcomingAssignments = [];
                    $scope.missingAssignments = [];
                    return;
                }

                $scope.assignments = data.assignments;
                // tranforms dates to moments
                _.each($scope.assignments, function(elem) { elem.due_date = moment(elem.due_date); });
                $scope.assignments = _.sortBy(data.assignments, function(elem) { return elem.due_date; });

                // Save off the upcoming assignments, then remove them from our current assignments list
                $scope.upcomingAssignments = _.filter($scope.assignments, function(elem) { return (elem.due_date.diff(moment(), 'days')) >= 0; });
                $scope.assignments         = _.filter($scope.assignments, function(elem) { return (elem.due_date.diff(moment(), 'days')) < 0; });

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

                // get all the grades for this class
                var gradesConfig = {
                    filter: [
                        { name: 'assignment.section', val: section.id, },
                    ],
                };

                studentService.getGradesForStudent($scope.student.id, gradesConfig).then(
                    function success(data) {
                        // reset relevant data
                        $scope.completionGraph.data    = [0,0,0,];
                        $scope.assignmentsGraph.labels = [];
                        $scope.assignmentsGraph.data   = [];
                        $scope.missingAssignments      = [];
                        $scope.noGradeData             = [];

                        $scope.grades              = data.grades;
                        $scope.assignmentsToGrades = {};

                        _.each($scope.assignments, function(assignmentElem) {
                            // sort grades for assignment by date turned in
                            var gradesForAssignment       = _.where($scope.grades, { assignment: assignmentElem.id, });
                            var sortedGradesForAssignment = _.sortBy(gradesForAssignment, function(elem) { return -moment(elem.handin_datetime); });

                            // create lookup for grade on assignment, update completion graph with ontime/late/missing
                            // TODO(gzuber): what is there's no grade for this assignment?
                            if(sortedGradesForAssignment.length > 0) {
                                // take the most recent grade
                                var gradeForAssignment = sortedGradesForAssignment[0];
                                $scope.assignmentsToGrades[assignmentElem.id] = gradeForAssignment.score;

                                // was it on time?
                                if(!gradeForAssignment.late) {
                                    // on time
                                    $scope.completionGraph.data[$scope.ontimeIndex]++;
                                }
                                else {
                                    // late
                                    $scope.completionGraph.data[$scope.lateIndex]++;
                                }

                                if(gradeForAssignment.missing) {
                                    // missing
                                    $scope.completionGraph.data[$scope.missingIndex]++;
                                    $scope.missingAssignments.push(assignmentElem);
                                }
                            }
                            // mark it as "no data from lms"
                            else {
                                $scope.noGradeData.push(assignmentElem);
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
                        });

                    },
                    function error(response) {
                        toastService.error('The server wasn\'t able to get the student\'s grades for this class.');
                    }
                );

                // get the student's final grade for the class
                var finalGradeConfig = {
                    filter: [
                        { name: 'enrollment.section', val: section.id, },
                    ],
                };

                studentService.getFinalGradesForStudent($scope.student.id, finalGradeConfig).then(
                    function success(data) {
                        $scope.classGrade       = 0;
                        $scope.classGradeString = 'N/A';

                        if(data.final_grades !== null && data.final_grades !== undefined && data.final_grades.length > 0) {
                            var finalGrade = data.final_grades[0];
                            $scope.classGrade = finalGrade.final_percent;
                            $scope.classLetterGrade = finalGrade.letter_grade;

                            var classGradeString = $scope.classGrade.toString();
                            var decimalIndex = _.indexOf(classGradeString, '.');
                            $scope.classGradeText = decimalIndex === -1 ? classGradeString + '%' : classGradeString.slice(0, decimalIndex + 3) + '%';
                        }
                    },
                    function error(response) {
                        toastService.error('The server wasn\'t able to get the student\'s grades for this class.');
                    },
                );


            },
            function error(response) {
                toastService.error('The server wasn\'t able to get the assignments for this class.');
            }
        );
    };

    $scope.selectTerm = function(term) {
        $scope.selectedTerm = term;

        $scope.sectionsForTermFilter = null;
        if(term.id === -1) {
            // all current terms
            $scope.sectionsForTermFilter = function(elem) { return _.has(currentTermsLookup, elem.term); };
        }
        else {
            $scope.sectionsForTermFilter = function(elem) { return elem.term === term.id; };
        }
        var sectionsInTerm = _.filter($scope.sections, $scope.sectionsForTermFilter);
        if(sectionsInTerm.length === 0) {
            $scope.selectedSection = null;
        }
        else {
            $scope.selectSection(sectionsInTerm[0]);
        }
    };

    $scope.selectTerm($scope.selectedTerm);
});
