app.controller("manageClassesController", function ($scope, $rootScope, $location, students, teachers, sections, studentService, teacherService, sectionService, enrollmentService) {
    // don't think I will need teacherService
    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }

    // anywhere 's' or 't' was previously used for 'students' and 'teachers', 'c' will be used for 'classes'
    // another 's' for 'sections' would be confusing with 'students', which will probably use an 's' again

    var sectionTask = "view/edit";
    var sectionVSearchOrInfo = "search";
    var sectionDSearchOrInfo = "search";
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

    // create fast lookup sections dictionary
    for (var i = 0; i < $scope.sections.length; ++i) {
        var lookupName = $scope.sections[i].title;
        $scope.sectionsLookup[lookupName.toUpperCase()] = $scope.sections[i];
    }

    /**
     * Display search or form depending on the student task selected and set the active button
     * @param {string} task - the type of task selected.
     */
    $scope.changeSectionTask = function (task) {
        switch (sectionTask) {
            case "view/edit":
                $scope.displaySectionViewSearch = false;
                $scope.displayCEditInfo = false;
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
                if (sectionVSearchOrInfo === "info") {
                    $scope.displayCEditInfo = true;
                }
                break;
            case "delete":
                if (sectionDSearchOrInfo === "search") {
                    $scope.displaySectionDeleteSearch = true;
                } else {
                    $scope.displaySectionInfo = true;
                }
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
    $scope.viewSection = function () {
        if ($scope.sectionViewSearch.toUpperCase() in $scope.sectionsLookup) {
            $scope.sectionV = $scope.sectionsLookup[$scope.sectionViewSearch.toUpperCase()];
            // copy sectionV to sectionE
            $scope.sectionE = Object.assign({}, $scope.sectionV);
            $scope.displayCEditInfo = true;
            sectionVSearchOrInfo = "info";
            // make sure edit is still not displayed when switching
            $scope.viewCTitle = true;
            $scope.viewCTeacher = true;
        }
        else {
            //TODO: notify the user in some way
        }
    };

    /**
     * Turns the displayed teacher field into an editable input.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.editSection = function (field) {
        switch (field) {
            case "title":
                $scope.viewCTitle = false;
                break;
            case "teacher":
                $scope.viewCTeacher = false;
                break;
            default:
        }
    };

    /**
     * Restored the previous display of the selected section field and hides the editable input box.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.cancelCEdit = function (field) {
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
    };

    /**
     * Updates the selected section with the newly edited field.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.saveCEdit = function (field) {
        switch (field) {
            // update field
            case "title":
                $scope.sectionE.title = $scope.cTitle;
                break;
            case "teacher":
                $scope.sectionE.teacher = $scope.cTeacher;
                break;
            default:
        }
        // save with sectionE
        var tempSection = Object.assign({}, $scope.sectionE);
        delete tempSection.id;
        var sectionPromise = sectionService.updateSection($scope.sectionE.id, tempSection);
        sectionPromise.then(function success(data) {
            // set sectionV to sectionE to reflect update
            $scope.sectionV = Object.assign({}, $scope.sectionE);
            // then have to update sections and lookup
            for (var i = 0; i < $scope.sections.length; i++) {
                if ($scope.sections[i].id === $scope.sectionE.id) {
                    $scope.sections[i] = Object.assign({}, $scope.sectionE);
                    var upper = $scope.sectionE.title;
                    $scope.sectionsLookup[upper] = Object.assign({}, $scope.sectionE);
                }
            }
            switch (field) {
                // set view after call returns
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
        }, function error(response) {
            setErrorMessage(response);
        });
    };

    /**
     * Creates and adds a new section.
     */
    $scope.addSection = function () {
        var sectionPromise = sectionService.addSection($scope.newSection);
        sectionPromise.then(function success(data) {
            $scope.newSection = {};
            $scope.addSectionSuccess = true;
            $("#addSectionSuccess").fadeTo(2000, 500).slideUp(500, function () {
                $("#addSectionSuccess").slideUp(500);
            });
            $scope.sections.push(data.section);
            var lookupName = data.section.title;
            $scope.sectionsLookup[lookupName.toUpperCase()] = data.section;
        }, function error(response) {
            setErrorMessage(response);
            $scope.addSectionFailure = true;
            $("#addSectionFailure").fadeTo(5000, 500).slideUp(500, function () {
                $("#addSectionFailure").slideUp(500);
            });
        });
    };

    /**
     * Hides the delete section search bar and displays its info with an option to delete.
     */
    $scope.displayDeleteSection = function () {
        $scope.sectionD = $scope.sectionsLookup[$scope.sectionDeleteSearch.toUpperCase()];
        $scope.displaySectionDeleteSearch = false;
        $scope.displaySectionInfo = true;
        $scope.clearSectionDeleteSearch();
        sectionDSearchOrInfo = "info";
    };

    /**
     * Deletes the selected teacher from the database.
     */
    $scope.deleteSection = function () {
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
            $scope.deleteSectionSuccess = true;
            $("#deleteSectionSuccess").fadeTo(2000, 500).slideUp(500, function () {
                $("#deleteSectionSuccess").slideUp(500);
            });
            $scope.displaySectionDeleteSearch = true;
            $scope.displaySectionInfo = false;
            sectionDSearchOrInfo = "search";
            $scope.sectionDeleteSearch = "";
            // check to see if sectionV/E is this deleted section and change view accordingly
            if ($scope.sectionV.id === id) {
                $scope.sectionV = {};
                $scope.sectionE = {};
                $scope.displayCEditInfo = false;
                sectionVSearchOrInfo = "search";
                $scope.clearSectionViewSearch();
                $scope.cTitle = "";
                $scope.cTeacher = "";
            }
        }, function error(response) {
            setErrorMessage(response);
            $scope.deleteSectionFailure = true;
            $("#deleteSectionFailure").fadeTo(5000, 500).slideUp(500, function () {
                $("#deleteSectionFailure").slideUp(500);
            });
        });
    };

    /**
     * Restores the delete section search box and hides its info and delete option.
     */
    $scope.cancelDeleteSection = function () {
        $scope.clearSectionDeleteSearch();
        $scope.displaySectionDeleteSearch = true;
        $scope.displaySectionInfo = false;
        $scope.sectionD = {};
        sectionDSearchOrInfo = "search";
    };

    /**
     * Clears the view section search bar.
     */
    $scope.clearSectionViewSearch = function () {
        $scope.sectionViewSearch = "";
    };

    /**
     * Clears the delete section search bar.
     */
    $scope.clearSectionDeleteSearch = function () {
        $scope.sectionDeleteSearch = "";
    };

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
})