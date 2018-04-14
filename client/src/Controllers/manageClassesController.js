app.controller("manageClassesController", function($scope, $rootScope, $location, toastService, students, userData, sections, studentService, sectionService, enrollmentService, termsInfo) {
    $scope.location = $location;

    // anywhere 's' or 't' was previously used for 'students' and 'teachers', 'c' will be used for 'classes'
    // another 's' for 'sections' would be confusing with 'students', which will probably use an 's' again

    var sectionTask = "view/edit";
    $scope.terms = termsInfo.terms;
    $scope.termsLookup = _.indexBy(termsInfo.terms, "id");
    $scope.termSettings = _.indexBy(termsInfo.term_settings, "id");
    $scope.dailySchedules = _.indexBy(termsInfo.daily_schedules, "id");
    $scope.displaySectionViewSearch = true;
    $scope.displaySectionForm = false;
    $scope.displaySectionInfo = false;
    $scope.displayCEditInfo = false;
    $scope.sectionEdit = false;
    $scope.sectionsLookup = {};
    $scope.sectionV = {};
    $scope.sectionE = {};
    $scope.sectionD = {};
    $scope.newSection = {};
    $scope.sections = sections.sections;
    // lookup needs to be based off of id not fullname
    $scope.students = _.indexBy(students.students, 'id');
    $scope.teachers = userData.sprout_users;
    $scope.teachersLookup = {};
    $scope.teacherIdLookup = {};
    $scope.enrolledStudentsArray = [];
    $scope.unenrolledStudentsArray = [];
    $scope.addValidTeacher = false;
    $scope.editValidTeacher = false;
    $scope.editingAll = true;
    $scope.viewSectionTerm = {
        name: "All Terms"
    };

    /**
     * Toggles the section edit
     */
    $scope.toggleSectionEdit = function() {
        $scope.sectionEdit = !$scope.sectionEdit;
    }

    /**
     * Sets cTerm to selected term
     * @param {string} term - the selected display term.
     */
    $scope.setTerm = function(term) {
        $scope.cTerm = term;
        $scope.cPeriod = $scope.periodArraysLookup[$scope.cTerm.id][$scope.cPeriod.period - 1];
    }

    /**
     * Sets cPeriod to selected period
     * @param {string} period - the selected display period.
     */
    $scope.setPeriod = function(period) {
        $scope.cPeriod = period;
    }

    /**
     * Sets term variables to selected term
     * @param {object} term - the term selected.
     */
    $scope.selectTerm = function(term) {
        $scope.viewSectionTerm = term;
    }

    /**
     * Extra part of error message
     */
    function errorResponse() {
        var message = "";
        if ($scope.errorMessage != null && $scope.errorMessage !== "") {
            message = " Error message: " + $scope.errorMessage;
        }
        return message;
    }

    // create fast lookup sections dictionary
    for (var i = 0; i < $scope.sections.length; ++i) {
        var lookupName = $scope.sections[i].title;
        $scope.sectionsLookup[lookupName.toUpperCase()] = $scope.sections[i];
    }

    // create fast lookup teacher dictionary that will map to teacher id, and teacher id to teacher name and email
    for (var i = 0; i < $scope.teachers.length; ++i) {
        var lookupName = $scope.teachers[i].first_name + " " + $scope.teachers[i].last_name + " (" + $scope.teachers[i].email + ")";
        $scope.teachersLookup[lookupName.toUpperCase()] = $scope.teachers[i].pk;
        $scope.teacherIdLookup[$scope.teachers[i].pk] = lookupName;
    }

    /**
     * Converts numbers to viewable periods
     */
    function getDisplayPeriods() {
        $scope.periodArraysLookup = {};
        for (var i = 0; i < $scope.terms.length; i++) {
            var periodsForDisplay = [];
            var schedule = $scope.dailySchedules[$scope.termSettings[$scope.terms[i].settings].schedule];
            var day = 1;
            var period = 0;
            var noDays = schedule.total_periods === schedule.periods_per_day;
            for (var j = 0; j < schedule.total_periods; j++) {
                period++;
                if (period > schedule.periods_per_day) {
                    day++;
                    period = 1;
                }
                noDays ? periodsForDisplay.push({
                    period: j + 1,
                    periodName: "Period " + period
                }) : periodsForDisplay.push({
                    period: j + 1,
                    periodName: "Day " + day + " Period " + period
                });
            }
            $scope.periodArraysLookup[$scope.terms[i].id] = periodsForDisplay;
        }
    }

    getDisplayPeriods();

    /**
     * Make sure teacher text is an actual teacher.
     * @param {string} task - the type of task selected.
     */
    $scope.checkValidTeacher = function(task, teacher) {
        switch (task) {
            case "add":
                if($('#cteacher2 select.polyfilling').length === 0) {
                    if ($scope.addTeacher != null) {
                        $scope.addValidTeacher = _.has($scope.teachersLookup, $scope.addTeacher.toUpperCase());
                    }
                }
                else {
                    var pk = parseInt($('#cteacher2 select.polyfilling').find(':selected').attr('pk'));
                    $scope.addValidTeacher = _.find($scope.teachers, function(elem) { return elem.pk === pk; }) !== null;
                }
                break;
            case "edit":
                $scope.cTeacher = teacher;
                if($('#cteacher select.polyfilling').length === 0) {
                    if ($scope.cTeacher != null) {
                        $scope.editValidTeacher = _.has($scope.teachersLookup, $scope.cTeacher.toUpperCase());
                    }
                }
                else {
                    var pk = parseInt($('#cteacher select.polyfilling').find(':selected').attr('pk'));
                    $scope.editValidTeacher = _.find($scope.teachers, function(elem) { return elem.pk === pk; }) !== null;
                }
                break;
            default:
        }
    }

    /**
     * Display search or form depending on the student task selected and set the active button
     * @param {string} task - the type of task selected.
     */
    $scope.changeSectionTask = function(task) {
        switch (sectionTask) {
            case "view/edit":
                $scope.displaySectionViewSearch = false;
                break;
            case "add":
                $scope.displaySectionForm = false;
                break;
            default:
        }
        // set to new task
        sectionTask = task;
        switch (task) {
            case "view/edit":
                $scope.displaySectionViewSearch = true;
                break;
            case "add":
                $scope.displaySectionForm = true;
                break;
            default:
        }
    };

    /**
     * Displays section info.
     * @param {object} section - the selected section.
     */
    $scope.viewSection = function(section) {
        $scope.sectionV = section;
        // copy sectionV to sectionE
        $scope.sectionE = Object.assign({}, $scope.sectionV);
        $scope.displayCEditInfo = true;
        // make sure edit is still not displayed when switching
        $scope.sectionEdit = false;
        $scope.cTerm = $scope.termsLookup[section.term];
        $scope.cPeriod = $scope.periodArraysLookup[$scope.termsLookup[section.term].id][section.schedule_position - 1];
        // initialize
        $scope.cTeacher = $scope.teacherIdLookup[$scope.sectionV.teacher];
        // set enrolledStudents and unenrolledStudents
        $('#enrolledInput').val('');
        $('#unenrolledInput').val('');
        getEnrolledStudents();
    };

    /**
     * Updates the selected section with the newly edited field.
     */
    $scope.saveCEdit = function() {
        if($('#cteacher select.polyfilling').length === 0) {
            if ($scope.cTeacher != null) {
                $scope.sectionE.teacher = $scope.teachersLookup[$scope.cTeacher.toUpperCase()];
            } else {
                $scope.sectionE.teacher = null;
            }
        }
        else {
            var pk = parseInt($('#cteacher select.polyfilling').find(':selected').attr('pk'));
            $scope.sectionE.teacher = _.find($scope.teachers, function(elem) { return elem.pk === pk; }).pk;
        }

        $scope.sectionE.term = $scope.cTerm.id;
        // added to prevent error in console
        if($scope.cPeriod !== null && $scope.cPeriod !== undefined) {
            $scope.sectionE.schedule_position = $scope.cPeriod.period;
        }
        else {
            $scope.sectionE.schedule_position = null;
        }
        // save with sectionE
        var tempSection = Object.assign({}, $scope.sectionE);
        delete tempSection.id;
        var sectionPromise = sectionService.updateSection($scope.sectionE.id, tempSection);
        sectionPromise.then(function success(data) {
            // save previous title in case it was changed
            var tempTitle = $scope.sectionV.title.toUpperCase();
            if ($scope.sectionE.title !== $scope.sectionV.title) {
                delete $scope.sectionsLookup[tempTitle];
            }
            // set sectionV to sectionE to reflect update
            $scope.sectionV = Object.assign({}, $scope.sectionE);
            // then have to update sections and lookup
            for (var i = 0; i < $scope.sections.length; i++) {
                if ($scope.sections[i].id === $scope.sectionE.id) {
                    $scope.sections[i] = Object.assign({}, $scope.sectionE);
                    var upper = $scope.sectionE.title.toUpperCase();
                    $scope.sectionsLookup[upper] = Object.assign({}, $scope.sectionE);
                }
            }
            // do I actually have to do this?
            $scope.cPeriod = $scope.periodArraysLookup[$scope.termsLookup[$scope.sectionE.term].id][$scope.sectionE.schedule_position - 1];
            //$scope.cTeacher = $scope.teacherIdLookup[$scope.sectionV.teacher];
            $scope.sectionEdit = false;
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to save your edit." + errorResponse());
        });
    };

    /**
     * Creates and adds a new section.
     */
    $scope.addSection = function() {

        if($('#cteacher2 select.polyfilling').length === 0) {
            if ($scope.addTeacher != null && $scope.addTeacher !== "") {
                $scope.newSection.teacher = $scope.teachersLookup[$scope.addTeacher.toUpperCase()];
            }
        }
        else {
            var pk = parseInt($('#cteacher2 select.polyfilling').find(':selected').attr('pk'));
            $scope.newSection.teacher = _.find($scope.teachers, function(elem) { return elem.pk === pk; }).pk;
        }

        $scope.newSection.term = $scope.newSectionTerm.id;
        if ($scope.newSectionPeriod != null) {
            $scope.newSection.schedule_position = $scope.newSectionPeriod.period;
        }
        var sectionPromise = sectionService.addSection($scope.newSection);
        sectionPromise.then(function success(data) {
            $scope.addTeacher = "";
            $scope.newSection = {};
            $scope.newSectionTerm = null;
            $scope.newSectionPeriod = null;
            $scope.addPeriodsForDisplay = [];
            toastService.success("New section has been added.");
            $scope.sections.push(data.section);
            var lookupName = data.section.title;
            $scope.sectionsLookup[lookupName.toUpperCase()] = data.section;
            $scope.addSectionForm.$setPristine();
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to add the class." + errorResponse());
        });
    };

    /**
     * Deletes the selected section from the database.
     */
    $scope.deleteSection = function() {
        var sectionPromise = sectionService.deleteSection($scope.sectionD.id);
        sectionPromise.then(function success(data) {
            // remove section from sections and sectionsLookup
            for (var i = 0; i < $scope.sections.length; i++) {
                if ($scope.sections[i].id === $scope.sectionD.id) {
                    $scope.sections.splice(i, 1);
                    var upper = $scope.sectionD.title;
                    delete $scope.sectionsLookup[upper];
                }
            }
            var id = $scope.sectionD.id;
            $scope.sectionD = {};
            $scope.displaySectionInfo = false;
            // check to see if sectionV/E is this deleted section and change view accordingly
            if ($scope.sectionV.id === id) {
                $scope.sectionV = {};
                $scope.sectionE = {};
                $scope.clearSectionViewSearch();
                $scope.cTitle = "";
                $scope.cTeacher = "";
            }
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to delete the class" + errorResponse());
        });
    };

    /**
     * Sets sectionD.
     * @param {section} section - section used to set.
     */
    $scope.setSectionD = function(section) {
        $scope.sectionD = section;
        $("#deleteSectionModal").modal();
    }

    /**
     * Grabs all enrolled students in the selected section.
     */
    function getEnrolledStudents() {
        var getStudentsPromise = enrollmentService.getStudentEnrollments({
            include: ['student.*'],
            filter: [{
                name: 'section',
                val: $scope.sectionV.id
            }],
        });
        getStudentsPromise.then(function success(data) {
            $scope.enrolledStudents = _.indexBy(data.students, 'id');
            $scope.enrollments = _.indexBy(data.enrollments, 'id');
            refreshEnrollmentsArray();
            // set unenrolled students to all students and then delete each enrolled student with id
            $scope.unenrolledStudents = Object.assign({}, $scope.students);
            for (var student in $scope.enrolledStudents) {
                delete $scope.unenrolledStudents[student];
            }
            refreshStudentArrays();
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to get the enrolled students." + errorResponse());
        });
    };

    /**
     * Enrolls a student in the selected section.
     * @param {number} studentID - the student_id of the student to be enrolled.
     */
    $scope.enrollStudent = function(studentID) {
        var enrollmentObj = {
            section: $scope.sectionV.id,
            student: studentID,
        }
        var enrollPromise = enrollmentService.addStudentEnrollment(enrollmentObj);
        enrollPromise.then(function success(data) {
            var enrollment = data.enrollment;
            // add to enrollments
            $scope.enrollments[enrollment.id] = enrollment;
            refreshEnrollmentsArray();
            // move student from unenrolledstudents into enrolledStudents
            var tempStudent = $scope.unenrolledStudents[enrollment.student];
            delete $scope.unenrolledStudents[tempStudent.id];
            $scope.enrolledStudents[tempStudent.id] = tempStudent;
            refreshStudentArrays();
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to enroll the student." + errorResponse());
        })
    }

    /**
     * Sets student arrays equal to their lookup values.
     */
    function refreshStudentArrays() {
        $scope.enrolledStudentsArray = _.values($scope.enrolledStudents);
        $scope.unenrolledStudentsArray = _.values($scope.unenrolledStudents);
    }

    /**
     * Sets enrollment array equal to its lookup values.
     */
    function refreshEnrollmentsArray() {
        $scope.enrollmentsArray = _.values($scope.enrollments);
    }

    /**
     * Removes a student from the selected section.
     * @param {number} enrollment - the enrollment to be deleted.
     */
    $scope.unenrollStudent = function(enrollmentID) {
        var unenrollPromise = enrollmentService.deleteStudentEnrollment(enrollmentID);
        unenrollPromise.then(function success(data) {
            // remove from enrollments
            var enrollment = $scope.enrollments[enrollmentID];
            delete $scope.enrollments[enrollmentID];
            refreshEnrollmentsArray();
            // move student from enrolledStudents into unenrolledStudents
            var tempStudent = $scope.enrolledStudents[enrollment.student];
            delete $scope.enrolledStudents[tempStudent.id];
            $scope.unenrolledStudents[tempStudent.id] = tempStudent;
            refreshStudentArrays();
        })
    }

    /**
     * Clears the view section search bar.
     */
    $scope.clearSectionViewSearch = function() {
        if ($scope.displayCEditInfo) {
            $scope.displayCEditInfo = false;
        }
    };

    /**
     * Updates the displayed error message.
     * @param {response} response - response containing data and error message.
     */
    function setErrorMessage(response) {
        $scope.errorMessage = response.data;
    }

    /**
     * Filter used for viewing sections.
     * @param {section} section - section to be filtered.
     */
    $scope.viewSectionFilter = function(section) {
        if ($scope.sectionViewSearch == null || (section.teacher != null && $scope.teacherIdLookup[section.teacher].toUpperCase().includes($scope.sectionViewSearch.toUpperCase())) ||
            section.title.toUpperCase().includes($scope.sectionViewSearch.toUpperCase()) ||
            $scope.periodArraysLookup[$scope.termsLookup[section.term].id][section.schedule_position - 1].periodName.toUpperCase().includes($scope.sectionViewSearch.toUpperCase())) {
            return true;
        }
        return false; // otherwise it won't be within the results
    };

    /**
     * Filter used for unenrolled students.
     * @param {student} student - student to be filtered.
     */
    $scope.unenrolledStudentFilter = function(student) {
        if ($scope.unenrolledInput == null) {
            return true;
        }
        var input = $scope.unenrolledInput.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if (student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || student.birthdate.toUpperCase().includes(input) ||
            fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }

    /**
     * Filter used for enrolled students.
     * @param {enrollment} enrollment - enrollment to be filtered.
     */
    $scope.enrolledStudentFilter = function(enrollment) {
        var student = $scope.enrolledStudents[enrollment.student];
        if ($scope.enrolledInput == null) {
            return true;
        }
        var input = $scope.enrolledInput.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if (student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || student.birthdate.toUpperCase().includes(input) ||
            fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }
});

// orderby for class roster students
app.filter('classRosterSort', function() {
    return function(items, enrolledStudents) {
        if (items == null) {
            return [];
        }
        var filter = [];
        for (var i = 0; i < items.length; i++) {
            filter.push(enrolledStudents[items[i].student]);
        }
        var sortedStudents = _.sortBy(filter, 'last_name');
        // I have my student sorted by last Name
        // now I want to translate this to enrollments
        // an enrollment has a student id
        // a student has a student id
        // an enrollments lookup by student id would be nice
        var itemsLookup = _.indexBy(items, 'student');
        var sortedEnrollments = [];
        for (var i = 0; i < sortedStudents.length; i++) {
            sortedEnrollments.push(itemsLookup[sortedStudents[i].id]);
        }
        return sortedEnrollments;
    }
});
