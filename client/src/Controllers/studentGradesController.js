app.controller("studentGradesController", function ($scope, $rootScope, $routeParams, sectionService, studentService, studentData, enrollmentData) {
    $scope.student  = studentData.student;
    $scope.sections = [];

    if(enrollmentData.sections !== null && enrollmentData.sections !== undefined) {
        $scope.sections = _.sortBy(enrollmentData.sections, 'title');
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
        colors: [],
        datasetOverride: {
            //backgroundColor: [
                //"rgba(255,99,132,0.2)",
                //"rgba(255,159,64,0.2)",
                //"rgba(255,205,86,0.2)",
                //"rgba(75,192,192,0.2)",
                //"rgba(54,162,235,0.2)",
                //"rgba(153,102,255,0.2)",
                //"rgba(201,203,207,0.2)",
            //],
            //hoverBackgroundColor: [
                //"rgba(255,99,132,0.4)",
                //"rgba(255,159,64,0.4)",
                //"rgba(255,205,86,0.4)",
                //"rgba(75,192,192,0.4)",
                //"rgba(54,162,235,0.4)",
                //"rgba(153,102,255,0.4)",
                //"rgba(201,203,207,0.4)",
            //],
            //borderColor: [
                //"rgba(255,99,132,0.7)",
                //"rgba(255,159,64,0.7)",
                //"rgba(255,205,86,0.7)",
                //"rgba(75,192,192,0.7)",
                //"rgba(54,162,235,0.7)",
                //"rgba(153,102,255,0.7)",
                //"rgba(201,203,207,0.7)",
            //],
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
        colors: [],
        datasetOverride: {
            backgroundColor: [
                "rgba(75,192,192,0.2)",
                "rgba(255,159,64,0.2)",
                "rgba(255,99,132,0.2)",
                "rgba(54,162,235,0.2)",
                "rgba(153,102,255,0.2)",
                "rgba(201,203,207,0.2)",
                "rgba(255,205,86,0.2)",
            ],
            hoverBackgroundColor: [
                "rgba(75,192,192,0.4)",
                "rgba(255,159,64,0.4)",
                "rgba(255,99,132,0.4)",
                "rgba(54,162,235,0.4)",
                "rgba(153,102,255,0.4)",
                "rgba(201,203,207,0.4)",
                "rgba(255,205,86,0.4)",
            ],
            borderColor: [
                "rgba(75,192,192,0.7)",
                "rgba(255,159,64,0.7)",
                "rgba(255,99,132,0.7)",
                "rgba(54,162,235,0.7)",
                "rgba(153,102,255,0.7)",
                "rgba(201,203,207,0.7)",
                "rgba(255,205,86,0.7)",
            ],
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
                    return;
                }
                $scope.noAssignments = false;
                $scope.assignments = _.sortBy(data.assignments, function(elem) { return moment(elem.due_date); });

                // Save off the upcoming assignments, then remove them from our current assignments list
                $scope.upcomingAssignments = _.filter($scope.assignments, function(elem) { return (moment(elem.due_date).diff(moment(), 'days')) >= 0; });
                $scope.assignments         = _.filter($scope.assignments, function(elem) { return (moment(elem.due_date).diff(moment(), 'days')) < 0; });

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
                        console.log(data);

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
                    }
                );
            },
            function error(response) {
                //TODO: notify user
            }
        );
    };

    if($scope.sections.length > 0) {
        $scope.selectSection($scope.sections[0]);
    }
    else {
        $scope.selectedSection = {};
    }

});
