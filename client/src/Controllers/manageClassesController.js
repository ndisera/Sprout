app.controller("manageClassesController", function($scope, $rootScope, $location, students, userData, sections, studentService, sectionService, enrollmentService) {

    // anywhere 's' or 't' was previously used for 'students' and 'teachers', 'c' will be used for 'classes'
    // another 's' for 'sections' would be confusing with 'students', which will probably use an 's' again

    var sectionTask = "view/edit";
    $scope.displaySectionViewSearch = true;
    $scope.displaySectionDeleteSearch = false;
    $scope.displaySectionForm = false;
    $scope.displaySectionInfo = false;
    $scope.displayCEditInfo = false;
    $scope.viewCTitle = true;
    $scope.viewCTeacher = true;
    $scope.addSectionSuccess = false;
    $scope.deleteSectionSuccess = false;
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
     * Make sure teacher text is an actual teacher.
     * @param {string} task - the type of task selected.
     */
    $scope.checkValidTeacher = function(task) {
        switch (task) {
            case "add":
                $scope.addValidTeacher = _.has($scope.teachersLookup, $scope.addTeacher.toUpperCase());
                break;
            case "edit":
                $scope.editValidTeacher = _.has($scope.teachersLookup, $scope.cTeacher.toUpperCase());
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
            case "delete":
                $scope.displaySectionInfo = false;
                $scope.displaySectionDeleteSearch = false;
                $scope.deleteSectionSuccess = false;
                break;
            case "add":
                $scope.displaySectionForm = false;
                $scope.addSectionSuccess = false;
                break;
            default:
        }
        // set to new task
        sectionTask = task;
        switch (task) {
            case "view/edit":
                $scope.displaySectionViewSearch = true;
                break;
            case "delete":
                $scope.displaySectionDeleteSearch = true;
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
        if (task === 'delete') {
            document.getElementById('cDeleteButton').classList.add('active');
            document.getElementById('cDeleteButton2').classList.add('active');
        } else {
            document.getElementById('cDeleteButton').classList.remove('active');
            document.getElementById('cDeleteButton2').classList.remove('active');
        }
    }

    /**
     * Displays teacher info if name in teacher search bar is valid.
     */
    $scope.viewSection = function(section) {
        $scope.sectionV = section;
        // copy sectionV to sectionE
        $scope.sectionE = Object.assign({}, $scope.sectionV);
        $scope.displayCEditInfo = true;
        // make sure edit is still not displayed when switching
        $scope.viewCTitle = true;
        $scope.viewCTeacher = true;
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
                checkIfAllSelected()
                break;
            case "teacher":
                $scope.viewCTeacher = false;
                checkIfAllSelected()
                break;
            case "none":
                $scope.viewCTitle = true;
                $scope.viewCTeacher = true;
                $scope.editingAll = true;
                break;
            case "all":
                $scope.viewCTitle = false;
                $scope.viewCTeacher = false;
                $scope.editingAll = false;
                break;
            default:
        }
    };

    /**
     * Sets edit all button according to what edit fields are ready to edit.
     */
    function checkIfAllSelected() {
        if ($scope.viewCTitle === true && $scope.viewCTeacher === true) {
            $scope.editingAll = true;
        } else if ($scope.viewCTitle === false && $scope.viewCTeacher === false) {
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
                $scope.sectionE.teacher = $scope.teachersLookup[$scope.cTeacher.toUpperCase()];
                break;
            default:
        }
        // save with sectionE
        var tempSection = Object.assign({}, $scope.sectionE);
        delete tempSection.id;
        var sectionPromise = sectionService.updateSection($scope.sectionE.id, tempSection);
        sectionPromise.then(function success(data) {
            // need to see if same section is currently selected for delete and update if so
            if ($scope.sectionE.id === $scope.sectionD.id) {
                $scope.sectionD = Object.assign({}, $scope.sectionE);
            }
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
                default:
            }
        }, function error(response) {
            setErrorMessage(response);
        });
    };

    /**
     * Creates and adds a new section.
     */
    $scope.addSection = function() {
        $scope.newSection.teacher = $scope.teachersLookup[$scope.addTeacher.toUpperCase()];
        var sectionPromise = sectionService.addSection($scope.newSection);
        sectionPromise.then(function success(data) {
            $scope.addTeacher = "";
            $scope.newSection = {};
            $scope.addSectionSuccess = true;
            $("#addSectionSuccess").fadeTo(2000, 500).slideUp(500, function() {
                $("#addSectionSuccess").slideUp(500);
            });
            $scope.sections.push(data.section);
            var lookupName = data.section.title;
            $scope.sectionsLookup[lookupName.toUpperCase()] = data.section;
        }, function error(response) {
            setErrorMessage(response);
            $scope.addSectionFailure = true;
            $("#addSectionFailure").fadeTo(5000, 500).slideUp(500, function() {
                $("#addSectionFailure").slideUp(500);
            });
        });
    };

    /**
     * Hides the delete section search bar and displays its info with an option to delete.
     */
    $scope.displayDeleteSection = function() {
        if ($scope.sectionDeleteSearch.toUpperCase() in $scope.sectionsLookup) {
            $scope.sectionD = $scope.sectionsLookup[$scope.sectionDeleteSearch.toUpperCase()];
            $scope.displaySectionDeleteSearch = false;
            $scope.displaySectionInfo = true;
            $scope.clearSectionDeleteSearch();
        }
    };

    /**
     * Deletes the selected teacher from the database.
     */
    $scope.deleteSection = function() {
        var sectionPromise = sectionService.deleteSection($scope.sectionD.id);
        sectionPromise.then(function success(data) {
            // remove teacher from teachers and teachersLookup
            for (var i = 0; i < $scope.sections.length; i++) {
                if ($scope.sections[i].id === $scope.sectionD.id) {
                    $scope.sections.splice(i, 1);
                    var upper = $scope.sectionD.title;
                    delete $scope.sectionsLookup[upper];
                }
            }
            var id = $scope.sectionD.id;
            $scope.sectionD = {};
            $scope.sectionDeleteSearch = "";
            $scope.deleteSectionSuccess = true;
            $("#deleteSectionSuccess").fadeTo(2000, 500).slideUp(500, function() {
                $("#deleteSectionSuccess").slideUp(500);
            });
            $scope.displaySectionDeleteSearch = true;
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
            $scope.deleteSectionFailure = true;
            $("#deleteSectionFailure").fadeTo(5000, 500).slideUp(500, function() {
                $("#deleteSectionFailure").slideUp(500);
            });
        });
    };

    /**
     * Sets sectionD.
     * @param {section} section - section used to set.
     */
    $scope.setSectionD = function(section) {
        $scope.sectionD = section;
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
            $scope.errorMessage = response;
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
            $scope.errorMessage = response;
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
     * Clears the delete section search bar.
     */
    $scope.clearSectionDeleteSearch = function() {
        $scope.sectionDeleteSearch = "";
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
        if ($scope.sectionViewSearch == null || $scope.teacherIdLookup[section.teacher].toUpperCase().includes($scope.sectionViewSearch.toUpperCase())
            || section.title.toUpperCase().includes($scope.sectionViewSearch.toUpperCase())) {
            return true;
        }
        return false; // otherwise it won't be within the results
    };

    /**
     * Filter used for deleting sections.
     * @param {section} section - section to be filtered.
     */
    $scope.deleteSectionFilter = function(section) {
        if ($scope.sectionDeleteSearch == null || $scope.teacherIdLookup[section.teacher].toUpperCase().includes($scope.sectionDeleteSearch.toUpperCase())
            || section.title.toUpperCase().includes($scope.sectionDeleteSearch.toUpperCase())) {
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
})
