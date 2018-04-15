app.controller("testsController", function($scope, $rootScope, $location, toastService, testService, tests, students, userService) {
    $scope.location = $location;

    $scope.takenBy = [];
    $scope.notTakenBy = [];
    $scope.tests = _.sortBy(tests.standardized_tests, 'test_name');
    $scope.students = students.students;
    $scope.studentsLookup = _.indexBy($scope.students, 'id');

    /**
     * Updates selectedTest and the student results
     * @param {test} test - the test object to update with
     */
    $scope.selectTest = function(test) {
        $scope.selectedTest = test;
        updateResults();
    };

    /**
     * Downloads the test report
     */
    $scope.downloadReport = function() {
        var currentDate = moment().format('YYYY-MM-DD').toString();
        var doc = new jsPDF('p', 'pt'); // was mm previous, 1 mm is 2.83465 pt
        doc.setFont('Times', 'normal');
        var startDate = moment($scope.startDate).format('YYYY-MM-DD').toString();
        var endDate = moment($scope.endDate).format('YYYY-MM-DD').toString();
        var scale = 2.83465;
        doc.addImage($rootScope.logoImgData, 'JPEG', 180 * scale, 15 * scale, 15 * scale, 15 * scale);

        doc.setFontSize(30);
        doc.text(15 * scale, 25 * scale, $scope.selectedTest.test_name + ' Report');
        doc.setFontSize(18);
        doc.text(15 * scale, 33 * scale, startDate + " to " + endDate);
        doc.setFontSize(12);
        doc.text(15 * scale, 41 * scale, "Generated on " + currentDate + " by " + userService.user.firstName + " " + userService.user.lastName);
        doc.setFontSize(18);

        var takenColumns = ["Date", "Name", "Student ID", "Score"];
        var notTakenColumns = ["Name", "Student ID"];
        var takenRows = [];
        var notTakenRows = [];
        var takenData = _.chain($scope.takenBy).sortBy('last_name').sortBy('testDate').value();
        var notTakenData = _.chain($scope.notTakenBy).sortBy('last_name').sortBy('testDate').value();
        _.each(takenData, function(elem) {
            takenRows.push([elem.testDate, elem.first_name + " " + elem.last_name, elem.student_id, elem.testScore]);
        });
        _.each(notTakenData, function(elem) {
            notTakenRows.push([elem.first_name + " " + elem.last_name, elem.student_id]);
        });

        doc.text(15 * scale, 54 * scale, "Taken:")
        doc.autoTable(takenColumns, takenRows, { startY: 58 * scale, showHeader: 'firstPage'});
        doc.setFont('Times', 'normal');
        let first = doc.autoTable.previous;
        doc.text(15 * scale, first.finalY + (12 * scale), "Not Taken:");
        doc.autoTable(notTakenColumns, notTakenRows, { startY: first.finalY + (16 * scale), showHeader: 'firstPage'});
        doc.save($scope.selectedTest.test_name + '_' + currentDate + '.pdf');
    };

    /**
     * date-picker related code
     */
    var startDateKey = 'startDate';
    var endDateKey = 'endDate';

    $scope[startDateKey] = moment();
    $scope[endDateKey] = moment();

    /**
     * called when start or end daterange picker changed
     * updates min/max values of date range, updates list of students
     *
     * @param {string} varName - name of datepicker that was change
     * @param {newDate} newDate - new date that was selected
     */
    $scope.dateRangeChange = function(varName, newDate) {
        // update date
        $scope[varName] = newDate;

        // broadcast event to update min/max values
        if (varName === startDateKey) {
            $scope.$broadcast('pickerUpdate', endDateKey, {
                minDate: $scope[startDateKey]
            });
        } else if (varName === endDateKey) {
            $scope.$broadcast('pickerUpdate', startDateKey, {
                maxDate: $scope[endDateKey]
            });
        }

        updateResults();
    };

    /**
     * Updates the list of students who have and have not taken the selected test
     */
    function updateResults() {
        // get tests with startDate, endDate, testName, and include students
        $scope.testScores = [];
        $scope.takenBy = [];
        $scope.notTakenBy = [];
        var config = {
            include: ['student.id', ],
            exclude: ['id', ],
            filter: [{
                    name: 'date.range',
                    val: $scope.startDate.format('YYYY-MM-DD').toString(),
                },
                {
                    name: 'date.range',
                    val: $scope.endDate.format('YYYY-MM-DD').toString(),
                },
                {
                    name: 'standardized_test',
                    val: $scope.selectedTest.id,
                },
            ],
            sort: ['date', student.id],
        };

        testService.getTestScores(config).then(
            function success(data) {
                // handle not taken first
                var notTakenByLookup = _.indexBy($scope.students, 'id');
                _.each(data.students, function(elem) {
                    if (notTakenByLookup.hasOwnProperty(elem.id)) {
                        delete notTakenByLookup[elem.id];
                    }
                });
                // now convert lookup to array
                for (var key in notTakenByLookup) {
                    $scope.notTakenBy.push(notTakenByLookup[key]);
                }

                // takenBy may have repeating students now (multiple dates), so add a student entry for every score
                _.each(data.standardized_test_scores, function(elem) {
                    var student = Object.assign({}, $scope.studentsLookup[elem.student]);
                    student.testScore = elem.score;
                    student.testDate = elem.date;
                    $scope.takenBy.push(student);
                });
            },
            function error(response) {
                toastService.error('The server wasn\'t able to get any test scores.');
            }
        );
    }

    /**
     * Navigates to student's test page
     */
    $scope.viewStudent = function(id) {
        $location.path('/student/' + id + '/tests');
    };

    /**
     * Filter used for students who've taken the selected test
     * @param {student} student - student to be filtered.
     */
    $scope.takenFilter = function(student) {
        if ($scope.takenSearch == null) {
            return true;
        }
        var input = $scope.takenSearch.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if (student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || fullname.toUpperCase().includes(input) ||
            student.testDate.includes(input) || (student.testScore + "").includes(input)) {
            return true;
        }
        return false;
    };

    /**
     * Filter used for students who've taken the selected test
     * @param {student} student - student to be filtered.
     */
    $scope.notTakenFilter = function(student) {
        if ($scope.notTakenSearch == null) {
            return true;
        }
        var input = $scope.notTakenSearch.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if (student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    };

    // initialization
    if ($scope.tests.length > 0) {
        $scope.selectTest($scope.tests[0]);
    }
});
