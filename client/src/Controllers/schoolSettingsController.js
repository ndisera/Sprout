app.controller("schoolSettingsController", function($scope, $rootScope, $location, toastService, userService, holidays, termsInfo, tests, schools, holidayService, testService, termService, schoolService) {
    $scope.location = $location;
    $scope.holidays = holidays.holidays;
    $scope.tests = tests.standardized_tests;
    $scope.terms = termsInfo.terms;

    $scope.termsLookup = _.indexBy(termsInfo.terms, "id");
    $scope.termSettings = _.indexBy(termsInfo.term_settings, "id");
    $scope.dailySchedules = _.indexBy(termsInfo.daily_schedules, "id");

    schools.school_settings.length > 0 ? $scope.school = schools.school_settings[0] : $scope.school = {};
    $scope.gradeLevels = ["K", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    $scope.schoolMinGrade = $scope.school.grade_range_lower;
    $scope.schoolMaxGrade = $scope.school.grade_range_upper;

    $scope.newHoliday = {};
    $scope.newTest = {};
    $scope.newTerm = {};

    $scope.displayTestForm = false;
    $scope.displayHolidayForm = false;
    $scope.displayTermForm = false;

    $scope.edit = false;

    $scope.editSchool = function(field) {
        switch (field) {
            case "name":
                $scope.editSchoolName = true;
                checkIfAllSelected();
                break;
            case "location":
                $scope.editSchoolLocation = true;
                checkIfAllSelected();
                break;
            case "minGrade":
                $scope.editSchoolMinGrade = true;
                checkIfAllSelected();
                break;
            case "maxGrade":
                $scope.editSchoolMaxGrade = true;
                checkIfAllSelected();
                break;
            case "all":
                $scope.editSchoolName = true;
                $scope.editSchoolLocation = true;
                $scope.editSchoolMinGrade = true;
                $scope.editSchoolMaxGrade = true;
                $scope.editingAll = true;
                break;
            case "none":
                $scope.editSchoolName = false;
                $scope.editSchoolLocation = false;
                $scope.editSchoolMinGrade = false;
                $scope.editSchoolMaxGrade = false;
                $scope.editingAll = false;
                break;
        }
    };

    $scope.cancelSchoolEdit = function(field) {
        switch (field) {
            case "name":
                $scope.editSchoolName = false;
                $scope.schoolName = "";
                break;
            case "location":
                $scope.editSchoolLocation = false;
                $scope.schoolLocation = "";
                break;
            case "minGrade":
                $scope.editSchoolMinGrade = false;
                break;
            case "maxGrade":
                $scope.editSchoolMaxGrade = false;
                break;
        }
        checkIfAllSelected();
    };

    /**
     * Updates school with the newly edited field.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.saveSchoolEdit = function(field) {
        $scope.schoolE = Object.assign({}, $scope.school);
        switch (field) {
            // update field
            case "name":
                $scope.schoolE.school_name = $scope.schoolName;
                break;
            case "location":
                $scope.schoolE.school_location = $scope.schoolLocation;
                break;
            case "minGrade":
                $scope.schoolMinGrade === "K" ? $scope.schoolE.grade_range_lower = 0 : $scope.schoolE.grade_range_lower = $scope.schoolMinGrade;
                break;
            case "maxGrade":
                $scope.schoolMaxGrade === "K" ? $scope.schoolE.grade_range_upper = 0 : $scope.schoolE.grade_range_upper = $scope.schoolMaxGrade;
                break;
            default:
        }
        // save with schoolE
        delete $scope.schoolE.id;
        schoolService.updateSchool(1, $scope.schoolE).then(
            function success(data) {
                $scope.school = data.school_settings;
                switch (field) {
                    // set view after call returns
                    case "name":
                        $scope.editSchoolName = false;
                        $scope.schoolName = "";
                        break;
                    case "location":
                        $scope.editSchoolLocation = false;
                        $scope.schoolLocation = "";
                        break;
                    case "minGrade":
                        $scope.editSchoolMinGrade = false;
                        $scope.schoolMinGrade = $scope.school.grade_range_lower;
                        break;
                    case "maxGrade":
                        $scope.editSchoolMaxGrade = false;
                        $scope.schoolMaxGrade = $scope.school.grade_range_upper;
                        break;
                    default:
                }
                checkIfAllSelected();
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save your edit." + errorResponse());
            });
    };

    /**
     * Sets edit all button according to what edit fields are ready to edit.
     */
    function checkIfAllSelected() {
        if ($scope.editSchoolName && $scope.editSchoolLocation && $scope.editSchoolMinGrade && $scope.editSchoolMaxGrade) {
            $scope.editingAll = true;
        } else if (!$scope.editSchoolName && !$scope.editSchoolLocation && !$scope.editSchoolMinGrade && !$scope.editSchoolMaxGrade) {
            $scope.editingAll = false;
        }
    }

    /**
     * Cancels row edit
     * @param {number} index - row index.
     * @param {string} type - type of item.
     */
    $scope.removeEdit = function(index, type) {
        this.edit = false;
        $("#" + type + "-row" + index).addClass('pointer');
    }

    /**
     * Makes a row editable
     * @param {number} index - row index.
     * @param {string} type - type of item.
     */
    $scope.showEdit = function(index, type) {
        this.edit = true;
        $("#" + type + "-row" + index).removeClass('pointer');
    }

    /**
     * Creates lookups containing edit values
     */
    function setupLookups() {
        var tests = [];
        var holidays = [];
        var terms = [];
        for (var i = 0; i < $scope.tests.length; i++) {
            tests.push(Object.assign({}, $scope.tests[i]));
        }
        $scope.eTests = _.indexBy(tests, "id");

        for (var i = 0; i < $scope.holidays.length; i++) {
            holidays.push(Object.assign({}, $scope.holidays[i]));
        }
        $scope.eHolidays = _.indexBy(holidays, "id");

        for (var i = 0; i < $scope.terms.length; i++) {
            terms.push(Object.assign({}, $scope.terms[i]));
        }
        $scope.eTerms = _.indexBy(terms, "id");
    }

    setupLookups();

    /**
     * Sets up properties of the item to display in the delete form
     * @param {object} item - item to take values from.
     * @param {string} type - the type of item.
     */
    function setItemProperties(item, type) {
        switch (type) {
            case "holiday":
                $scope.item = [{
                        title: 'Name',
                        value: item.name
                    },
                    {
                        title: 'Begins',
                        value: item.start_date
                    },
                    {
                        title: 'Ends',
                        value: item.end_date
                    },
                ];
                break;
            case "test":
                $scope.item = [{
                        title: 'Name',
                        value: item.test_name
                    },
                    {
                        title: 'Min Score',
                        value: item.min_score
                    },
                    {
                        title: 'Max Score',
                        value: item.max_score
                    }
                ];
                break;
            case "term":
                $scope.item = [{
                        title: 'Name',
                        value: item.name
                    },
                    {
                        title: 'Begins',
                        value: item.start_date
                    },
                    {
                        title: 'Ends',
                        value: item.end_date
                    }
                ];
                break;
        }
    }

    /**
     * Displays delete modal with item and item type
     * @param {object} item - item to take values from.
     * @param {string} type - the type of item.
     */
    $scope.setItem = function(item, type) {
        setItemProperties(item, type);
        $scope.itemType = type;
        $scope.itemId = item.id;
        $("#deleteItemModal").modal();
    };

    /**
     * Deletes an item
     * @param {number} id - the item id.
     * @param {string} type - the type of item.
     */
    $scope.deleteItem = function(id, type) {
        switch (type) {
            case "holiday":
                deleteHoliday(id);
                break;
            case "test":
                deleteTest(id);
                break;
            case "term":
                deleteTerm(id)
                break;
        }
    }

    /**
     * Deletes a holiday
     * @param {number} holidayId - id of holiday to be deleted.
     */
    function deleteHoliday(holidayId) {
        holidayService.deleteHoliday(holidayId).then(
            function success(response) {
                // remove from display array
                for (var i = 0; i < $scope.holidays.length; i++) {
                    if ($scope.holidays[i].id === holidayId) {
                        $scope.holidays.splice(i, 1);
                    }
                }
                // remove from edit lookup
                delete $scope.eHolidays[holidayId];
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save your edit." + errorResponse());
            }
        );
    };

    /**
     * Deletes a term
     * @param {number} termId - id of term to be deleted.
     */
    function deleteTerm(termId) {
        termService.deleteTerm(termId).then(
            function success(response) {
                // remove from display array
                for (var i = 0; i < $scope.terms.length; i++) {
                    if ($scope.terms[i].id === termId) {
                        $scope.terms.splice(i, 1);
                    }
                }
                // remove from edit lookup
                delete $scope.eTerms[termId];
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save your edit." + errorResponse());
            }
        );
    };

    /**
     * Deletes a test
     * @param {number} testId - id of test to be deleted.
     */
    function deleteTest(testId) {
        testService.deleteTest(testId).then(
            function success(response) {
                // remove from display array
                for (var i = 0; i < $scope.tests.length; i++) {
                    if ($scope.tests[i].id === testId) {
                        $scope.tests.splice(i, 1);
                    }
                }
                // remove from edit lookup
                delete $scope.eTests[testId];
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save your edit." + errorResponse());
            }
        );
    };

    /**
     * Creates a new holiday
     */
    $scope.addHoliday = function() {
        $scope.newHoliday.start_date = moment($scope.newHoliday.start_date).format('YYYY-MM-DD').toString();
        $scope.newHoliday.end_date = moment($scope.newHoliday.end_date).format('YYYY-MM-DD').toString();
        $scope.newHoliday.school_year = 1;
        holidayService.addHoliday($scope.newHoliday).then(
            function success(response) {
                // add to display array
                $scope.holidays.push(response.holiday);
                // add to edit lookup (should point to different object)
                var copy = Object.assign({}, response.holiday);
                $scope.eHolidays[copy.id] = copy;
                $scope.displayHolidayForm = false;
                $scope.newHoliday = {};
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save the new holiday." + errorResponse());
            }
        );
    };

    /**
     * Creates a new term
     */
    $scope.addTerm = function() {
        $scope.newTerm.start_date = moment($scope.newTerm.start_date).format('YYYY-MM-DD').toString();
        $scope.newTerm.end_date = moment($scope.newTerm.end_date).format('YYYY-MM-DD').toString();
        $scope.newTerm.school_year = 1;
        $scope.newTerm.settings = 1;
        termService.addTerm($scope.newTerm).then(
            function success(response) {
                // add to display array
                $scope.terms.push(response.term);
                // add to edit lookup (should point to different object)
                var copy = Object.assign({}, response.term);
                $scope.eTerms[copy.id] = copy;
                $scope.displayTermForm = false;
                $scope.newTerm = {};
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save the new term." + errorResponse());
            }
        );
    };

    /**
     * Creates a new test
     */
    $scope.addTest = function() {
        testService.addTest($scope.newTest).then(
            function success(response) {
                // add to display array
                $scope.tests.push(response.standardized_test);
                // add to edit lookup (should point to different object)
                var copy = Object.assign({}, response.standardized_test);
                $scope.eTests[copy.id] = copy;
                $scope.displayTestForm = false;
                $scope.newTest = {};
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save the new test." + errorResponse());
            }
        );
    };

    /**
     * Updates a holiday
     * @param {number} holidayId - id of holiday to be updated.
     */
    $scope.updateHoliday = function(holidayId, index) {
        if (typeof $scope.eHolidays[holidayId].start_date !== 'string' && $scope.eHolidays[holidayId].start_date != null) {
            $scope.eHolidays[holidayId].start_date = moment($scope.eHolidays[holidayId].start_date).format('YYYY-MM-DD').toString();
        }
        if (typeof $scope.eHolidays[holidayId].end_date !== 'string' && $scope.eHolidays[holidayId].end_date != null) {
            $scope.eHolidays[holidayId].end_date = moment($scope.eHolidays[holidayId].end_date).format('YYYY-MM-DD').toString();
        }
        var newHoliday = Object.assign({}, $scope.eHolidays[holidayId]);
        delete newHoliday.id;
        holidayService.updateHoliday(holidayId, newHoliday).then(
            function success(response) {
                // update $scope.holidays
                for (var i = 0; i < $scope.holidays.length; i++) {
                    if ($scope.holidays[i].id === holidayId) {
                        $scope.holidays[i] = response.holiday;
                    }
                }
                $scope.removeEdit(index, 'holiday');
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save your edit." + errorResponse());
            }
        );
    };

    /**
     * Updates a test
     * @param {number} holidayId - id of test to be updated.
     */
    $scope.updateTest = function(testId, index) {
        var newTest = Object.assign({}, $scope.eTests[testId]);
        delete newTest.id;
        testService.updateTest(testId, newTest).then(
            function success(response) {
                // update $scope.tests
                for (var i = 0; i < $scope.tests.length; i++) {
                    if ($scope.tests[i].id === testId) {
                        $scope.tests[i] = response.standardized_test;
                    }
                }
                $scope.removeEdit(index, 'test');
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save your edit." + errorResponse());
            }
        );
    };

    /**
     * Updates a term
     * @param {number} holidayId - id of term to be updated.
     */
    $scope.updateTerm = function(termId, index) {
        if (typeof $scope.eTerms[termId].start_date !== 'string' && $scope.eTerms[termId].start_date != null) {
            $scope.eTerms[termId].start_date = moment($scope.eTerms[termId].start_date).format('YYYY-MM-DD').toString();
        }
        if (typeof $scope.eTerms[termId].end_date !== 'string' && $scope.eTerms[termId].end_date != null) {
            $scope.eTerms[termId].end_date = moment($scope.eTerms[termId].end_date).format('YYYY-MM-DD').toString();
        }
        var newTerm = Object.assign({}, $scope.eTerms[termId]);
        delete newTerm.id;
        termService.updateTerm(termId, newTerm).then(
            function success(response) {
                // update $scope.terms
                for (var i = 0; i < $scope.terms.length; i++) {
                    if ($scope.terms[i].id === termId) {
                        $scope.terms[i] = response.term;
                    }
                }
                $scope.removeEdit(index, 'term');
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save your edit." + errorResponse());
            }
        );
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
     * Extra part of error message
     */
    function errorResponse() {
        var message = "";
        if ($scope.errorMessage != null && $scope.errorMessage !== "") {
            message = " Error message: " + $scope.errorMessage;
        }
        return message;
    }

});
