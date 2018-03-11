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
    $scope.viewCTitle = true;
    $scope.viewCTeacher = true;
    $scope.viewCTerm = true;
    $scope.viewCPeriod = true;
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
    $scope.checkValidTeacher = function(task) {
        switch (task) {
            case "add":
                if ($scope.addTeacher != null) {
                    $scope.addValidTeacher = _.has($scope.teachersLookup, $scope.addTeacher.toUpperCase());
                }
                break;
            case "edit":
                if ($scope.cTeacher != null) {
                    $scope.editValidTeacher = _.has($scope.teachersLookup, $scope.cTeacher.toUpperCase());
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
        // remove or set active property
        setActiveButton(task);
    };

    /**
     * Leaves the most recently selected button active and removes the active class from the other buttons
     * @param {string} task - the type of task selected.
     */
    function setActiveButton(task) {
        if (task === 'view/edit') {
            document.getElementById('cViewButton').classList.add('active');
            document.getElementById('cViewButton2').classList.add('active');
        } else {
            document.getElementById('cViewButton').classList.remove('active');
            document.getElementById('cViewButton2').classList.remove('active');
        }
        if (task === 'add') {
            document.getElementById('cAddButton').classList.add('active');
            document.getElementById('cAddButton2').classList.add('active');
        } else {
            document.getElementById('cAddButton').classList.remove('active');
            document.getElementById('cAddButton2').classList.remove('active');
        }
    }

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
        $scope.viewCTitle = true;
        $scope.viewCTeacher = true;
        $scope.viewCTerm = true;
        $scope.cTerm = $scope.termsLookup[section.term];
        $scope.cPeriod = $scope.periodArraysLookup[$scope.termsLookup[section.term].id][section.schedule_position - 1];
        $scope.viewCPeriod = true;
        // set enrolledStudents and unenrolledStudents
        $('#enrolledInput').val('');
        $('#unenrolledInput').val('');
        getEnrolledStudents();
    };

    /**
     * Turns the displayed teacher field into an editable input.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.editSection = function(field) {
        switch (field) {
            case "title":
                $scope.viewCTitle = false;
                checkIfAllSelected();
                break;
            case "teacher":
                $scope.viewCTeacher = false;
                checkIfAllSelected();
                break;
            case "term":
                $scope.viewCTerm = false;
                checkIfAllSelected();
                break;
            case "period":
                $scope.viewCPeriod = false;
                checkIfAllSelected();
                break;
            case "none":
                $scope.viewCTitle = true;
                $scope.viewCTeacher = true;
                $scope.viewCTerm = true;
                $scope.viewCPeriod = true;
                $scope.editingAll = true;
                break;
            case "all":
                $scope.viewCTitle = false;
                $scope.viewCTeacher = false;
                $scope.viewCTerm = false;
                $scope.viewCPeriod = false;
                $scope.editingAll = false;
                break;
            default:
        }
    };

    /**
     * Sets edit all button according to what edit fields are ready to edit.
     */
    function checkIfAllSelected() {
        if ($scope.viewCTitle && $scope.viewCTeacher && $scope.viewCTerm && $scope.viewCPeriod) {
            $scope.editingAll = true;
        } else if (!$scope.viewCTitle && !$scope.viewCTeacher && !$scope.viewCTerm && !$scope.viewCPeriod) {
            $scope.editingAll = false;
        }
    }

    /**
     * Restored the previous display of the selected section field and hides the editable input box.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.cancelCEdit = function(field) {
        switch (field) {
            case "title":
                $scope.viewCTitle = true;
                $scope.cTitle = "";
                break;
            case "teacher":
                $scope.viewCTeacher = true;
                $scope.cTeacher = "";
                break;
            case "term":
                $scope.viewCTerm = true;
                break;
            case "period":
                $scope.viewCPeriod = true;
                break;
            default:
        }
        checkIfAllSelected()
    };

    /**
     * Updates the selected section with the newly edited field.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.saveCEdit = function(field) {
        switch (field) {
            // update field
            case "title":
                $scope.sectionE.title = $scope.cTitle;
                break;
            case "teacher":
                if ($scope.cTeacher != null) {
                    $scope.sectionE.teacher = $scope.teachersLookup[$scope.cTeacher.toUpperCase()];
                } else {
                    $scope.sectionE.teacher = null;
                }
                break;
            case "term":
                $scope.sectionE.term = $scope.cTerm.id;
                break;
            case "period":
                $scope.sectionE.schedule_position = $scope.cPeriod.period;
                break;
            default:
        }
        // save with sectionE
        var tempSection = Object.assign({}, $scope.sectionE);
        delete tempSection.id;
        var sectionPromise = sectionService.updateSection($scope.sectionE.id, tempSection);
        sectionPromise.then(function success(data) {
            // save previous title in case it was changed
            var tempTitle = $scope.sectionV.title.toUpperCase();
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
            switch (field) {
                // set view after call returns
                case "title":
                    // need to delete that lookup property
                    delete $scope.sectionsLookup[tempTitle];
                    $scope.viewCTitle = true;
                    $scope.cTitle = "";
                    break;
                case "teacher":
                    $scope.viewCTeacher = true;
                    $scope.cTeacher = "";
                    break;
                case "term":
                    $scope.viewCTerm = true;
                    $scope.cPeriod = $scope.periodArraysLookup[$scope.termsLookup[$scope.sectionE.term].id][$scope.sectionE.schedule_position - 1];
                    break;
                case "period":
                    $scope.viewCPeriod = true;
                    break;
                default:
            }
            checkIfAllSelected();
        }, function error(response) {
            setErrorMessage(response);
            toastService.error("The server was unable to save your edit." + errorResponse());
        });
    };

    /**
     * Creates and adds a new section.
     */
    $scope.addSection = function() {
        if ($scope.addTeacher != null && $scope.addTeacher !== "") {
            $scope.newSection.teacher = $scope.teachersLookup[$scope.addTeacher.toUpperCase()];
        }
        $scope.newSection.term = $scope.newSectionTerm.id;
        if ($scope.newSectionPeriod != null) {
            $scope.newSection.schedule_position = $scope.periodArraysLookup[$scope.termsLookup[$scope.newSection.term].id].indexOf($scope.newSectionPeriod.periodName);
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
        $scope.errorMessage = [];
        for (var property in response.data) {
            if (response.data.hasOwnProperty(property)) {
                for (var i = 0; i < response.data[property].length; i++) {
                    $scope.errorMessage.push(response.data[property][i]);
                }
            }
        }
        $scope.errorMessage = $scope.errorMessage.join(" ");
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
