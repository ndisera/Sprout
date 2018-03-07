app.controller("schoolSettingsController", function($scope, $rootScope, $location, toastService, userService, holidays, termsInfo, tests, schools, schedules, holidayService, testService, termService, schoolService, scheduleService) {
    $scope.location = $location;
    $scope.holidays = holidays.holidays;
    $scope.tests = tests.standardized_tests;
    $scope.terms = termsInfo.terms;
    // this is different from daily schedules gotten from terms, and dropdowns including schedules will use this
    $scope.schedules = schedules.daily_schedules;

    // need this to display schedule name
    $scope.termsLookup = _.indexBy(termsInfo.terms, "id");
    $scope.termSettings = _.indexBy(termsInfo.term_settings, "id");
    $scope.dailySchedules = _.indexBy(termsInfo.daily_schedules, "id");

    $scope.school = schools.school_settings[0];
    zeroToK($scope.school);
    $scope.gradeLevels = ["K", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    $scope.schoolMinGrade = $scope.school.grade_range_lower;
    $scope.schoolMaxGrade = $scope.school.grade_range_upper;

    $scope.newHoliday = {};
    $scope.newTest = {};
    $scope.newTerm = {};
    $scope.newSchedule = {};

    $scope.displayTestForm = false;
    $scope.displayHolidayForm = false;
    $scope.displayTermForm = false;
    $scope.displayScheduleForm = false;

    $scope.edit = false;

    /**
     * Converts all grade 0 to K
     * @param {object} schoolObj - the school object being checked.
     */
    function zeroToK(schoolObj) {
        if (schoolObj.grade_range_lower === 0) {
            schoolObj.grade_range_lower = "K";
        }
        if (schoolObj.grade_range_upper === 0) {
            schoolObj.grade_range_upper = "K";
        }
    }

    /**
     * Converts all grade K to 0
     * @param {object} schoolObj - the school object being checked.
     */
    function kToZero(schoolObj) {
        if (schoolObj.grade_range_lower === "K") {
            schoolObj.grade_range_lower = 0;
        }
        if (schoolObj.grade_range_upper === "K") {
            schoolObj.grade_range_upper = 0;
        }
    }

    /**
     * Makes a field editable.
     * @param {string} field - the field to be edited.
     */
    $scope.editSchool = function(field) {
        switch (field) {
            case "name":
                $scope.editSchoolName = true;
                checkIfAllInfoSelected();
                break;
            case "location":
                $scope.editSchoolLocation = true;
                checkIfAllInfoSelected();
                break;
            case "minGrade":
                $scope.editSchoolMinGrade = true;
                checkIfAllRangeSelected();
                break;
            case "maxGrade":
                $scope.editSchoolMaxGrade = true;
                checkIfAllRangeSelected();
                break;
            case "allRange":
                $scope.editSchoolMinGrade = true;
                $scope.editSchoolMaxGrade = true;
                $scope.editingAllRange = true;
                break;
            case "noRange":
                $scope.editSchoolMinGrade = false;
                $scope.editSchoolMaxGrade = false;
                $scope.editingAllRange = false;
                break;
            case "allInfo":
                $scope.editSchoolName = true;
                $scope.editSchoolLocation = true;
                $scope.editingAllInfo = true;
                break;
            case "noInfo":
                $scope.editSchoolName = false;
                $scope.editSchoolLocation = false;
                $scope.editingAllInfo = false;
                break;
        }
    };

    /**
     * Cancels a field edit.
     * @param {string} field - the field being edited.
     */
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
        checkIfAllInfoSelected();
        checkIfAllRangeSelected();
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
                $scope.schoolE.grade_range_lower = $scope.schoolMinGrade;
                break;
            case "maxGrade":
                $scope.schoolE.grade_range_upper = $scope.schoolMaxGrade;
                break;
            default:
        }
        // save with schoolE
        kToZero($scope.schoolE);
        delete $scope.schoolE.id;
        schoolService.updateSchool(1, $scope.schoolE).then(
            function success(data) {
                $scope.school = data.school_settings;
                zeroToK($scope.school);
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
                checkIfAllRangeSelected();
                checkIfAllInfoSelected();
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save your edit." + errorResponse());
            });
    };

    /**
     * Sets edit all info button according to what edit fields are ready to edit.
     */
    function checkIfAllInfoSelected() {
        if ($scope.editSchoolName && $scope.editSchoolLocation) {
            $scope.editingAllInfo = true;
        } else if (!$scope.editSchoolName && !$scope.editSchoolLocation) {
            $scope.editingAllInfo = false;
        }
    }

    /**
     * Sets edit all range button according to what edit fields are ready to edit.
     */
    function checkIfAllRangeSelected() {
        if ($scope.editSchoolMinGrade && $scope.editSchoolMaxGrade) {
            $scope.editingAllRange = true;
        } else if (!$scope.editSchoolMinGrade && !$scope.editSchoolMaxGrade) {
            $scope.editingAllRange = false;
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
        var schedules = [];
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

        for (var i = 0; i < $scope.schedules.length; i++) {
            schedules.push(Object.assign({}, $scope.schedules[i]));
        }
        $scope.eSchedules = _.indexBy(schedules, "id");
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
            case "schedule":
                $scope.item = [{
                        title: 'Name',
                        value: item.name
                    },
                    {
                        title: 'Total Periods',
                        value: item.total_periods
                    },
                    {
                        title: 'Periods Per Day',
                        value: item.periods_per_day
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
                deleteTerm(id);
                break;
            case "schedule":
                deleteSchedule(id);
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
     * Deletes a schedule
     * @param {number} scheduleId - id of schedule to be deleted.
     */
    function deleteSchedule(scheduleId) {
        scheduleService.deleteSchedule(scheduleId).then(
            function success(response) {
                // remove from display array
                for (var i = 0; i < $scope.schedules.length; i++) {
                    if ($scope.schedules[i].id === scheduleId) {
                        $scope.schedules.splice(i, 1);
                    }
                }
                // remove from edit lookup
                delete $scope.eSchedules[scheduleId];
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
     * Creates a new schedule
     */
    $scope.addSchedule = function() {
        scheduleService.addSchedule($scope.newSchedule).then(
            function success(response) {
                // add to display array
                $scope.schedules.push(response.daily_schedule);
                // add to edit lookup (should point to different object)
                var copy = Object.assign({}, response.daily_schedule);
                $scope.eSchedules[copy.id] = copy;
                $scope.displayScheduleForm = false;
                $scope.newSchedule = {};
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save the new schedule." + errorResponse());
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
     * Updates a schedule
     * @param {number} scheduleId - id of schedule to be updated.
     */
    $scope.updateSchedule = function(scheduleId, index) {
        var newSchedule = Object.assign({}, $scope.eSchedules[scheduleId]);
        delete newSchedule.id;
        scheduleService.updateSchedule(scheduleId, newSchedule).then(
            function success(response) {
                // update $scope.schedules
                for (var i = 0; i < $scope.schedules.length; i++) {
                    if ($scope.schedules[i].id === scheduleId) {
                        $scope.schedules[i] = response.daily_schedule;
                    }
                }
                $scope.removeEdit(index, 'schedule');
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
