app.controller("inputBehaviorController", function ($scope, $location, $q, $timeout, toastService, termService, enrollmentService, behaviorService, studentService, studentData, terms) {
    $scope.location = $location;

    $scope.behaviorDate = moment();

    $scope.students    = studentData.students ? _.sortBy(studentData.students, 'last_name') : [];
    var studentsLookup = _.indexBy($scope.students, 'id');

    var enrollmentsLookup = {};
    var sectionsLookup    = {};

    var terms        = terms.terms ? termService.transformAndSortTerms(terms.terms) : [];
    var currentTerms = null;

    var behaviorKeys = ['id', 'enrollment', 'date', 'behavior', 'effort', ];
    var commentKeys  = ['id', 'student', 'date', 'body', ];
    var sectionKeys  = ['id', 'title', 'schedule_position', ];

    $scope.successString = null;
    $scope.errorString   = null;

    $scope.behaviorDateChange = function(varName, date) {
        $scope.behaviorDate = date;

        if($scope.students.length === 0) {
            return;
        }

        currentTerms = termService.getAllCurrentTerms(terms, $scope.behaviorDate);

        if(currentTerms.length === 0) {
            resetStudents($scope.students);
            return;
        }

        var dateString = $scope.behaviorDate.format('YYYY-MM-DD').toString();

        //TODO(gzuber): split this up to a call per student?
        var enrollmentConfig = {
            filter: [],
            exclude: ['section.*', ],
            include: ['section.id', 'section.title', 'section.schedule_position', ],
        };
        _.each(currentTerms, function(elem) { enrollmentConfig.filter.push({ name: 'section.term.in', val: elem.id, }); });
        _.each($scope.students, function(elem) { enrollmentConfig.filter.push({ name: 'student.id.in', val: elem.id, }); });

        enrollmentService.getStudentEnrollments(enrollmentConfig).then(
            function success(data) {
                var enrollments = [];
                var sections    = [];
                if(data) {
                    if(data.enrollments) {
                        enrollments = data.enrollments;
                    }
                    if(data.sections) {
                        sections = data.sections;
                    }
                }
                enrollmentsLookup = _.indexBy(enrollments, 'id');
                sectionsLookup    = _.indexBy(sections, 'id');

                var behaviorConfig = {
                    filter: [{ name: 'date', val: $scope.behaviorDate.format('YYYY-MM-DD').toString(), }, ],
                };
                _.each(enrollments, function(elem) { behaviorConfig.filter.push({ name: 'enrollment.in', val: elem.id, }); });
                
                behaviorService.getStudentBehavior(behaviorConfig).then(
                    function success(data) {
                        var behaviors = [];
                        if(data && data.behaviors) {
                            behaviors = data.behaviors;
                        }
                        var behaviorsByEnrollment = _.indexBy(behaviors, 'enrollment');

                        // reset my old data
                        resetStudents($scope.students);

                        // got my data, start building the structure
                        _.each(enrollments, function(elem) {
                            var student = null;
                            if(_.has(studentsLookup, elem.student)) {
                                student = studentsLookup[elem.student];
                            }

                            // guarantee that these objects are at least empty with the correct keys
                            var section = null;
                            if(_.has(sectionsLookup, elem.section)) {
                                section = sectionsLookup[elem.section];
                            }
                            section = copyObj(section, sectionKeys, true);

                            var behavior = null;
                            if(_.has(behaviorsByEnrollment, elem.id)) {
                                behavior = behaviorsByEnrollment[elem.id];
                            }
                            section.behavior = copyObj(behavior, behaviorKeys, true);
                            setObjProperty(section.behavior, 'enrollment', elem.id);
                            setObjProperty(section.behavior, 'date', dateString);

                            student.sections.push(section);
                        });

                        _.each($scope.students, function(elem) {
                            _.sortBy(elem.sections, 'schedule_position');
                        });

                        console.log($scope.students);
                    },
                    function error(response) {
                    }
                );
            },
            function error(response) {
            }
        );

        // get behavior comments
        _.each($scope.students, function(elem) {
            var commentConfig = {
                filter: [
                    { name: 'date', val: $scope.behaviorDate.format('YYYY-MM-DD').toString(), },
                    { name: 'student', val: elem.id, },
                ],
            };

            studentService.getBehaviorNotesForStudent(elem.id, commentConfig).then(
                function success(data) {
                    var comment = null;
                    if(data) {
                        if(data.behavior_notes && data.behavior_notes.length > 0) {
                            comment = data.behavior_notes[0];
                        }
                    }
                    elem.comment = copyObj(comment, commentKeys, true);
                    setObjProperty(elem.comment, 'student', elem.id);
                    setObjProperty(elem.comment, 'date', dateString);
                },
                function error(response) {
                }
            );
        });
    }

    $scope.saveBehavior = function() {
        var toPost = [];
        var toPut  = [];

        var commentsToPost = [];
        var commentsToPut  = [];

        _.each($scope.students, function(student) {
            _.each(student.sections, function(section) {
                if(section.behavior.behavior === section.behavior.behavior_temp && section.behavior.effort === section.behavior.effort_temp) {
                    // don't need to save
                    return;
                }
                if(section.behavior.behavior_temp === null && section.behavior.effort_temp === null) {
                    // don't need to save
                    return;
                }

                // need to save
                var entry = copyObj(section.behavior, behaviorKeys);

                if(entry.id === null) {
                    toPost.push(entry);
                }
                else {
                    toPut.push(entry);
                }
            });

            // see if I need to save the comment
            if(student.comment.body === student.comment.body_temp) {
                // don't need to save
                return;
            }

            if(student.comment.body_temp === null) {
                // don't need to save
                return;
            }

            var entry = copyObj(student.comment, commentKeys);

            if(entry.id === null) {
                commentsToPost.push(entry);
            }
            else {
                commentsToPut.push(entry);
            }
        });

        if(toPost.length === 0 && toPut.length === 0 && commentsToPost.length === 0 && commentsToPut.length === 0) {
            toastService.info('No changes were made.');
            return;
        }

        /**
         * what follows is a rough patch of code.
         * I'm trying to...
         *     1. save all records and comments
         *     2. wait until they're ALL done
         *     3. display appropriate error messages
         *         a. a toast if all succeeded
         *         b. a toast if all failed
         *         c. an alert with a comprehension list of what failed if only some failed
         */

        // promise to wait until everything is done
        var promises  = [];

        var failed    = [];
        var succeeded = [];

        var commentsFailed    = [];
        var commentsSucceeded = [];

        $scope.saving = true;
        $scope.savingFailed = false;
        var saveProgress = 0;
        var saveProgressTotal = toPost.length + toPut.length + commentsToPost.length + commentsToPut.length;
        $scope.saveProgressPercent = 0;

        var updateSaveProgress = function(succeeded) {
            saveProgress++;
            $scope.saveProgressPercent = (saveProgress / saveProgressTotal) * 100;
            if(!succeeded) { $scope.savingFailed = true; }
        };

        // save records
        _.each(toPost, function(req) {
            var deferred = $q.defer();
            behaviorService.addBehavior(req).then(
                function success(data) {
                    succeeded.push(data.behavior);
                    updateSaveProgress(true);
                    deferred.resolve();
                },
                function error(response) {
                    failed.push(req);
                    updateSaveProgress(false);
                    deferred.resolve();
                }
            );
            promises.push(deferred.promise);
        });

        _.each(toPut, function(req) { 
            var deferred = $q.defer();
            behaviorService.updateBehavior(req.id, req).then(
                function success(data) {
                    succeeded.push(data.behavior);
                    updateSaveProgress(true);
                    deferred.resolve();
                },
                function error(response) {
                    failed.push(req);
                    updateSaveProgress(false);
                    deferred.resolve();
                }
            );
            promises.push(deferred.promise);
        });

        // save comments
        _.each(commentsToPut, function(req) { 
            var deferred = $q.defer();
            studentService.updateBehaviorNoteForStudent(req.student, req.id, req).then(
                function success(data) {
                    commentsSucceeded.push(data.behavior_note);
                    updateSaveProgress(true);
                    deferred.resolve();
                },
                function error(response) {
                    commentsFailed.push(req);
                    updateSaveProgress(false);
                    deferred.resolve();
                }
            );
            promises.push(deferred.promise);
        });

        _.each(commentsToPost, function(req) { 
            var deferred = $q.defer();
            studentService.addBehaviorNoteForStudent(req.student, req).then(
                function success(data) {
                    commentsSucceeded.push(data.behavior_note);
                    updateSaveProgress(true);
                    deferred.resolve();
                },
                function error(response) {
                    commentsFailed.push(req);
                    updateSaveProgress(false);
                    deferred.resolve();
                }
            );
            promises.push(deferred.promise);
        });

        // wait for everything to finish
        $q.all(promises)
            .then(function(data) {
                $timeout(function() { $scope.saving = false; }, 3000);

                $scope.errorString   = null;

                // everything failed
                if(succeeded.length === 0 && commentsSucceeded.length === 0) {
                    toastService.error('Something when wrong... The server wasn\'t able to save your behavior records. Please try again later.');
                    return;
                }

                // something succeeded, so update the model to reflect the new server state
                propagateChanges(succeeded, commentsSucceeded);

                // everything succeeded -- yaaay
                if(failed.length === 0 && commentsFailed.length === 0) {
                    toastService.success('Your behavior records were saved!');
                    return;
                }

                // here's where it gets rough

                // go through failed records and bucket them by student
                var errorStudentBuckets = {};
                _.each(failed, function(elem) {
                    if(_.has(enrollmentsLookup, elem.enrollment)) {
                        var studentId = enrollmentsLookup[elem.enrollment].student;
                        if(!errorStudentBuckets[studentId]) {
                            errorStudentBuckets[studentId] = {};
                        }
                        if(!errorStudentBuckets[studentId].records) {
                            errorStudentBuckets[studentId].records = [];
                        }
                        errorStudentBuckets[studentId].records.push(elem);
                    }
                });

                // go through failed comments and bucket them by student
                _.each(commentsFailed, function(elem) {
                    var studentId = elem.student;
                    if(!errorStudentBuckets[studentId]) {
                        errorStudentBuckets[studentId] = {};
                    }
                    if(!errorStudentBuckets[studentId].comments) {
                        errorStudentBuckets[studentId].comments = [];
                    }
                    errorStudentBuckets[studentId].comments.push(elem);
                });

                // build a string telling the user, for each record/comment that failed...
                // 1. the student the record belongs to
                // 2. the comment failed 
                // 3. the section the record belongs to
                $scope.errorString = 'The server was unable to save the following records...\n';
                _.each(_.keys(errorStudentBuckets), function(elem) {
                    var student = studentsLookup[elem];
                    $scope.errorString += '\n' + student.first_name + ' ' + student.last_name + ':\n';
                    if(errorStudentBuckets[elem].comments && errorStudentBuckets[elem].comments.length > 0){
                        $scope.errorString += 'Behavior Comment.\n';
                    }
                    _.each(errorStudentBuckets[elem].records, function(req) {
                        var section = sectionsLookup[enrollmentsLookup[req.enrollment].section];
                        $scope.errorString += section.title + ' Record.\n';
                    });
                });
            })
            .catch(function(data) {
                // this can't happen, I'm not rejecting any promises
                // notify the user
                toastService.error('The server wasn\'t able to save your behavior records.');
            });
    };

    // this function manipulates the main data structure to make the provided records and comments reflect what's on the server
    function propagateChanges(records, comments) {
        _.each(records, function(elem) {
            if(_.has(enrollmentsLookup, elem.enrollment) && _.has(studentsLookup, enrollmentsLookup[elem.enrollment].student)) {
                var enrollment = enrollmentsLookup[elem.enrollment];
                var student = studentsLookup[enrollment.student];
                if(student.sections && student.sections.length > 0) {
                    var section = _.find(student.sections, function(elem) { return elem.id === enrollment.section; });
                    if(section) {
                        section.behavior = copyObj(elem, behaviorKeys, true);
                    }
                }
            }
        });
        _.each(comments, function(elem) {
            if(_.has(studentsLookup, elem.student)) {
                var student = studentsLookup[elem.student];
                student.comment = copyObj(elem, commentKeys, true);
            }
        });

        console.log($scope.students);
    }

    function resetStudents(students) {
        _.each(students, function(elem) {
            elem.sections = [];
        });
    }

    function copyObj(obj, objKeys, makeTemp) {
        var newObj = {};
        _.each(objKeys, function(elem) {
            if(makeTemp) {
                newObj[elem + '_temp'] = obj === null ? null : obj[elem];
                newObj[elem] = newObj[elem + '_temp'];
            }
            else {
                newObj[elem] = obj === null ? null : obj[elem + '_temp'];
            }
        });
        return newObj;
    }

    function setObjProperty(obj, key, val) {
        obj[key]           = val;
        obj[key + '_temp'] = val;
    }

    $scope.inputOptions = [{
            display: "",
            value: null,
        },
        {
            display: "0",
            value: 0,
        },
        {
            display: "1",
            value: 1,
        },
        {
            display: "2",
            value: 2,
        },
        {
            display: "3",
            value: 3,
        },
        {
            display: "4",
            value: 4,
        },
        {
            display: "5",
            value: 5,
        },
    ];

    $scope.studentSearch = {
        text: "",
    };

    /**
     * Filter used for students
     * @param {student} student - student to be filtered.
     */
    $scope.studentFilter = function(student) {
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
    }

    $scope.behaviorDateChange('', $scope.behaviorDate);
});
