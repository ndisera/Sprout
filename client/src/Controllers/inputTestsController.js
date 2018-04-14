app.controller("inputTestsController", function ($scope, $location, $q, $timeout, toastService, userService, termService, testService, studentService, students, enrollmentData, tests, terms) {
    $scope.location = $location;

    $scope.testDate = moment();
    $scope.studentSearch = { text: '', };

    $scope.students    = students.students ? _.sortBy(students.students, 'last_name') : [];
    var studentsLookup = _.indexBy($scope.students, 'id');

    $scope.tests        = tests.standardized_tests ? tests.standardized_tests : [];
    $scope.selectedTest = null;

    var terms = terms.terms ? terms.terms : [];

    $scope.groups = [];
    $scope.selectedGroup = null;
    $scope.sections = [];
    if(enrollmentData && enrollmentData.sections) {
        $scope.sections = enrollmentData.sections;
        $scope.groups = enrollmentData.sections;
    }
    $scope.groups.unshift({ id: -1, title: 'Caseload', });
    $scope.groups.unshift({ id: -2, title: 'All My Students', });

    $scope.enrollments = [];
    if(enrollmentData && enrollmentData.enrollments) {
        $scope.enrollments = enrollmentData.enrollments;
    }

    var currentTerms       = [];
    var currentTermsLookup = {};

    $scope.successString = null;
    $scope.errorString   = null;

    // set up a look up for whether a student is in a class
    var studentEnrollment = {};
    _.each($scope.students, function(elem) {
        studentEnrollment[elem.id] = new Set();
    });
    _.each($scope.enrollments, function(elem) {
        studentEnrollment[elem.student].add(elem.section);
    });

    /*** DROPDOWN SELECTS ***/

    $scope.selectGroup = function(group) {
        $scope.selectedGroup = group;
    }

    $scope.selectTest = function(test) {
        $scope.selectedTest = test;
        resetStudents();
    }

    /*** FILTERS ***/

    // set up a filter for groups based on date 
    // i.e. only show classes that were around for that date according to term
    $scope.groupFilter = function(elem) {
        if(elem.id === -1 || elem.id === -2) {
            return true;
        }
        if(_.has(currentTermsLookup, elem.term)) {
            return true;
        }
    };

    // filter for student based on group dropdown and text input
    $scope.studentFilter = function(student) { 
        if($scope.selectedGroup.id === -1) {
            if(student.case_manager !== userService.user.id) {
                return false;
            }
        }
        if($scope.selectedGroup.id >= 0) {
            if(!studentEnrollment[student.id].has($scope.selectedGroup.id)) {
                return false;
            }
        }
        if(_.find($scope.students, function(elem) { return elem.student_id === $scope.studentSearch.text; })) {
            return true;
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
    };
    
    /*** DATES ***/

    $scope.testDateChange = function(varName, val) {
        $scope.testDate = val;
        currentTerms = termService.getAllCurrentTerms(terms, $scope.testDate);
        currentTermsLookup = _.indexBy(currentTerms, 'id');

        resetStudents();
    };

    /*** DATA MANIPULATION ***/

    $scope.saveTests = function() {
        var test = $scope.selectedTest;
        var dateString = $scope.testDate.format('YYYY-MM-DD').toString();

        var toPost = [];
        var toPut = [];

        _.each($scope.studentFilterResults, function(elem) {
            if(elem.score_temp === null || elem.score_temp === undefined || elem.score_temp === '') {
                return;
            }

            if(elem.score === elem.score_temp) {
                return;
            }

            var entry = {
                date: dateString,
                standardized_test: test.id,
                score: elem.score_temp,
                student: elem.id,
            };

            //TODO(gzuber): remove
            if((Math.floor(Math.random() * 10) + 1) > 4) {
                entry.date = '';
            }

            if(elem.score_id !== null) {
                entry.id = elem.score_id;
                toPut.push(entry);
            }
            else {
                toPost.push(entry);
            }
        });

        if(toPost.length === 0 && toPut.length === 0) {
            toastService.info('No changes were made.');
            return;
        }

        var promises  = [];
        var succeeded = [];
        var failed    = [];

        $scope.saving = true;
        $scope.savingFailed = false;
        var saveProgress = 0;
        var saveProgressTotal = toPost.length + toPut.length;
        $scope.saveProgressPercent = 0;

        var updateSaveProgress = function(succeeded) {
            saveProgress++;
            $scope.saveProgressPercent = (saveProgress / saveProgressTotal) * 100;
            if(!succeeded) { $scope.savingFailed = true; }
        };

        _.each(toPost, function(elem) {
            var deferred = $q.defer();
            testService.addTestScore(elem).then(
                function success(data) {
                    succeeded.push(elem);
                    updateSaveProgress(true);
                    deferred.resolve();
                },
                function error(response) {
                    failed.push(elem);
                    updateSaveProgress(false);
                    deferred.resolve();
                }
            );
            promises.push(deferred.promise);
        });

        _.each(toPut, function(elem) {
            var deferred = $q.defer();
            testService.updateTestScore(elem.id, elem).then(
                function success(data) {
                    succeeded.push(elem);
                    updateSaveProgress(true);
                    deferred.resolve();
                },
                function error(response) {
                    failed.push(elem);
                    updateSaveProgress(false);
                    deferred.resolve();
                }
            );
            promises.push(deferred.promise);
        });

        $q.all(promises)
            .then(function(data) {
                $timeout(function() { $scope.saving = false; }, 3000);

                $scope.errorString   = null;

                // we failed everything
                if(succeeded.length === 0) {
                    toastService.error('Something went wrong... The server wasn\'t able to save the test scores. Please try again later.');
                    return;
                }

                propagateChanges(succeeded);

                // we did it -- yaaaay
                if(failed.length === 0) {
                    toastService.success('Your test scores were saved!');
                    return;
                }

                // we have a mix...
                $scope.errorString = 'The server was unable to save the following test scores...\n';
                _.each(failed, function(elem) {
                    var student = studentsLookup[elem.student];
                    $scope.errorString += student.first_name + ' ' + student.last_name + '\'s Test Score.\n';
                });
            });
    };

    // reset all user changes to students. think of this as a hard reset
    function resetStudents(scores) {
        if($scope.students.length === 0) {
            return;
        }

        _.each($scope.students, function(elem) {
            elem.score      = null;
            elem.score_temp = null;
            elem.score_id   = null;
        });

        var config = {
            filter: [
                { name: 'date', val: $scope.testDate.format('YYYY-MM-DD').toString(), },
                { name: 'standardized_test', val: $scope.selectedTest.id, },
            ],
        };
        _.each($scope.studentFilterResults, function(elem) { config.filter.push({ name: 'student.in', val: elem.id, }); });

        testService.getTestScores(config).then(
            function success(data) {
                if(data && data.standardized_test_scores) {
                    _.each(data.standardized_test_scores, function(elem) {
                        if(_.has(studentsLookup, elem.student)) {
                            studentsLookup[elem.student].score_id = elem.id;
                            studentsLookup[elem.student].score = elem.score;
                        }
                    });
                }
            },
            function error(response) {
                toastService.error('The server wasn\'t able to get test scores.');
            }
        );
    }

    // this will update all the scores to match the scores that were saved on the server
    // will also reset the temp variable because it was saved
    function propagateChanges(scores) {
        _.each(scores, function(elem) {
            if(_.has(studentsLookup, elem.student)) {
                studentsLookup[elem.student].score    = elem.score;
                studentsLookup[elem.student].score_id = elem.score_id;
                studentsLookup[elem.student].score_temp = null;
            }
        });
    }

    if($scope.tests.length > 0) {
        $scope.selectedTest = $scope.tests[0];
        $scope.testDateChange('', $scope.testDate);
        $scope.selectGroup($scope.groups[0]);
    }
});
