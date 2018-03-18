app.controller("schoolSettingsController", function($scope, $rootScope, $location, toastService, userService, holidays, terms, tests, schools, schedules, termSettings, schoolYears, holidayService, testService, termService, schoolService, scheduleService, schoolYearService) {
    $scope.location = $location;
    $scope.holidays = holidays.holidays;
    $scope.tests = tests.standardized_tests;
    $scope.terms = terms.terms;
    $scope.schedules = schedules.daily_schedules;
    $scope.schoolYears = schoolYears.school_years;
    $scope.schoolGradeEdit = false;
    $scope.schoolInfoEdit = false;

    // used for getting schedule name
    $scope.termSettingsLookup = _.indexBy(termSettings.term_settings, "id");
    $scope.schedulesLookup = _.indexBy($scope.schedules, "id");

    // used for getting setting id (this uses schedule id)
    $scope.scheduleSettingsLookup = _.indexBy(termSettings.term_settings, "schedule");

    // include schedule name for every term
    _.each($scope.terms, function(term) {
        var termSetting = $scope.termSettingsLookup[term.settings];
        var schedule = $scope.schedulesLookup[termSetting.schedule];
        term.schedule = schedule;
    });

    // doing it here so all of these have schedule_name
    $scope.termsLookup = _.indexBy($scope.terms, "id");

    $scope.school = schools.school_settings[0];
    zeroToK($scope.school);
    $scope.gradeLevels = ["K", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    // initialize school edit fields
    $scope.tempSchool = Object.assign({}, $scope.school);

    $scope.newHoliday = {};
    $scope.newTest = {};
    $scope.newTerm = {};
    $scope.newSchedule = {};
    $scope.newSchoolYear = {};

    $scope.displayTestForm = false;
    $scope.displayHolidayForm = false;
    $scope.displayTermForm = false;
    $scope.displayScheduleForm = false;
    $scope.displaySchoolYearForm = false;

    $scope.edit = false;

    initializeSchoolYears('all');
    setupLookups();

    /**
     * Toggles school info edit
     */
    $scope.toggleInfoEdit = function() {
        $scope.schoolInfoEdit = !$scope.schoolInfoEdit;
    };

    /**
     * Toggles school grade range edit
     */
    $scope.toggleGradeEdit = function() {
        $scope.schoolGradeEdit = !$scope.schoolGradeEdit;
    };

    /**
     * Cancels row edit
     * @param {number} index - row index.
     * @param {string} type - type of item.
     */
    $scope.removeEdit = function(index, type) {
        this.edit = false;
        $("#" + type + "-row" + index).addClass('pointer');
    };

    /**
     * Makes a row editable
     * @param {number} index - row index.
     * @param {string} type - type of item.
     */
    $scope.showEdit = function(index, type) {
        this.edit = true;
        $("#" + type + "-row" + index).removeClass('pointer');
    };

    /**
     * Initializes termSchoolYear and holidaySchoolYear to the current school year
     */
    function initializeSchoolYears(field) {
        var currentDate = getCurrentDate();
        var myDate = moment(currentDate, "YYYY-MM-DD");
        var chosenDifference = 0;
        for (var i = 0; i < $scope.schoolYears.length; i++) {
            var elem = $scope.schoolYears[i];
            var startDate = moment(elem.start_date, "YYYY-MM-DD");
            // pick school year that contains current date, else school year with closest start date
            if (elem.start_date <= currentDate && elem.end_date >= currentDate) {
                if (field === "term" || field === "all") $scope.termSchoolYear = elem;
                if (field === "holiday" || field === "all") $scope.holidaySchoolYear = elem;
                return;
            } else if (startDate.diff(myDate) < chosenDifference || chosenDifference === 0) {
                chosenDifference = startDate.diff(myDate);
                if (field === "term" || field === "all") $scope.termSchoolYear = elem;
                if (field === "holiday" || field === "all") $scope.holidaySchoolYear = elem;
            }
        }
    }

    /**
     * Gets today's date
     */
    function getCurrentDate() {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        today = yyyy + "-" + mm + '-' + dd;
        return today;
    }

    /**
     * Sets specified school year to selected year
     * @param {object} year - the school year selected.
     * @param {string} type - the type the school year is associated with.
     */
    $scope.selectSchoolYear = function(year, type) {
        type === "term" ? $scope.termSchoolYear = year : $scope.holidaySchoolYear = year;
    };

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
     * Updates school with the newly edited field.
     * @param {string} field - the name of the field that the user is editing.
     */
    $scope.saveSchoolEdit = function(field) {
        $scope.schoolE = Object.assign({}, $scope.school);
        switch (field) {
            // update field
            case "schoolInfo":
                $scope.schoolE.school_name = $scope.tempSchool.school_name;
                $scope.schoolE.school_location = $scope.tempSchool.school_location;
                break;
            case "schoolGrade":
                $scope.schoolE.grade_range_lower = $scope.tempSchool.grade_range_lower;
                $scope.schoolE.grade_range_upper = $scope.tempSchool.grade_range_upper;
                break;
        }
        // save with schoolE
        kToZero($scope.schoolE);
        delete $scope.schoolE.id;
        schoolService.updateSchool(1, $scope.schoolE).then(
            function success(data) {
                $scope.school = data.school_settings;
                zeroToK($scope.school);
                switch (field) {
                    case "schoolInfo":
                        $scope.schoolInfoEdit = false;
                        break;
                    case "schoolGrade":
                        $scope.schoolGradeEdit = false;
                        break;
                    default:
                }
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save your edit." + errorResponse());
            });
    };

    /**
     * Creates lookups containing edit values
     */
    function setupLookups() {
        $scope.eTests = setupLookup($scope.tests);
        $scope.eHolidays = setupLookup($scope.holidays);
        $scope.eTerms = setupLookup($scope.terms);
        $scope.eSchedules = setupLookup($scope.schedules);
        $scope.eSchoolYears = setupLookup($scope.schoolYears);
    }

    /**
     * Creates a lookup (by id) of the input array
     * @param {array} viewArray - array used to create lookup.
     * @return {array} the array lookup.
     */
    function setupLookup(viewArray) {
        var temp = [];
        for (var i = 0; i < viewArray.length; i++) {
            temp.push(Object.assign({}, viewArray[i]));
        }
        return _.indexBy(viewArray, "id");
    }

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
                    }
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
                        title: 'School Schedule',
                        value: item.schedule.name
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
            case "schoolYear":
                $scope.item = [{
                        title: 'Name',
                        value: item.title
                    },
                    {
                        title: 'Begins',
                        value: item.start_date
                    },
                    {
                        title: 'Ends',
                        value: item.end_date
                    },
                    {
                        title: 'Number of Terms',
                        value: item.num_terms
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
            case "schoolYear":
                deleteSchoolYear(id);
                break;
        }
    };

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
                delete $scope.termsLookup[termId];
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
                delete $scope.schedulesLookup[scheduleId];
                // I'm not going to update the settings lookup because nothing should ever have the same id

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
     * Deletes a school year
     * @param {number} yearId - id of school year to be deleted.
     */
    function deleteSchoolYear(yearId) {
        schoolYearService.deleteSchoolYear(yearId).then(
            function success(response) {
                // remove from display array
                for (var i = 0; i < $scope.schoolYears.length; i++) {
                    if ($scope.schoolYears[i].id === yearId) {
                        $scope.schoolYears.splice(i, 1);
                    }
                }
                // remove from edit lookup
                delete $scope.eSchoolYears[yearId];

                if ($scope.schoolYears.length === 0) {
                    $scope.termSchoolYear = null;
                    $scope.holidaySchoolYear = null;
                    return;
                }

                // need to also change school year dropdowns if chosen school year was delete
                if ($scope.termSchoolYear != null && $scope.termSchoolYear.id === yearId) {
                    initializeSchoolYears('term');
                }
                if ($scope.termSchoolYear != null && $scope.holidaySchoolYear.id === yearId) {
                    initializeSchoolYears('holiday');
                }
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
        $scope.newHoliday.school_year = $scope.holidaySchoolYear.id;
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
        $scope.newTerm.school_year = $scope.termSchoolYear.id;
        //$scope.newTerm.settings = 1;
        // gets me the term settings object by using schedule id
        var settings = $scope.scheduleSettingsLookup[$scope.newTermSchoolSchedule.id];
        $scope.newTerm.settings = settings.id;

        termService.addTerm($scope.newTerm).then(
            function success(response) {
                // add to display array
                var term = response.term;
                var termSetting = $scope.termSettingsLookup[term.settings];
                var termSchedule = $scope.schedulesLookup[termSetting.schedule];
                term.schedule = termSchedule;
                $scope.terms.push(term);
                $scope.termsLookup[term.id] = term;
                // add to edit lookup (should point to different object)
                var copy = Object.assign({}, term);
                $scope.eTerms[copy.id] = copy;
                $scope.displayTermForm = false;
                $scope.newTerm = {};
                $scope.newTermSchoolSchedule = "";
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
                $scope.schedulesLookup[response.daily_schedule.id] = response.daily_schedule;
                // add to edit lookup (should point to different object)
                var copy = Object.assign({}, response.daily_schedule);
                $scope.eSchedules[copy.id] = copy;
                $scope.displayScheduleForm = false;
                $scope.newSchedule = {};

                // now add the corresponding term settings
                var termObj = {
                    schedule: response.daily_schedule.id
                };
                termService.addTermSetting(termObj).then(
                    function success(tResponse) {
                        // update my term settings lookup
                        $scope.termSettingsLookup[tResponse.term_settings.id] = tResponse.term_settings;
                        // update my other lookup
                        $scope.scheduleSettingsLookup[response.daily_schedule.id] = tResponse.term_settings;
                    },
                    function error(tResponse) {
                        setErrorMessage(response);
                        toastService.error("The server was unable to save the new term setting." + errorResponse());
                    }
                )
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save the new schedule." + errorResponse());
            }
        );
    };

    /**
     * Creates a new school year
     */
    $scope.addSchoolYear = function() {
        $scope.newSchoolYear.start_date = moment($scope.newSchoolYear.start_date).format('YYYY-MM-DD').toString();
        $scope.newSchoolYear.end_date = moment($scope.newSchoolYear.end_date).format('YYYY-MM-DD').toString();
        schoolYearService.addSchoolYear($scope.newSchoolYear).then(
            function success(response) {
                // add to display array
                $scope.schoolYears.push(response.school_year);
                // add to edit lookup (should point to different object)
                var copy = Object.assign({}, response.school_year);
                $scope.eSchoolYears[copy.id] = copy;
                $scope.displaySchoolYearForm = false;
                $scope.newSchoolYear = {};
                // select this school year to display in dropdowns if it is the only one
                if ($scope.schoolYears.length === 1) {
                    initializeSchoolYears('all');
                }
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save the new school year." + errorResponse());
            }
        );
    };

    /**
     * Updates a holiday
     * @param {number} holidayId - id of holiday to be updated.
     */
    $scope.updateHoliday = function(holidayId, index) {
        var eHoliday = $scope.eHolidays[holidayId];
        if (typeof eHoliday.start_date !== 'string' && eHoliday.start_date != null) {
            eHoliday.start_date = moment(eHoliday.start_date).format('YYYY-MM-DD').toString();
        }
        if (typeof eHoliday.end_date !== 'string' && eHoliday.end_date != null) {
            eHoliday.end_date = moment(eHoliday.end_date).format('YYYY-MM-DD').toString();
        }
        var newHoliday = Object.assign({}, eHoliday);
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
        var eTerm = $scope.eTerms[termId];
        if (typeof eTerm.start_date !== 'string' && eTerm.start_date != null) {
            eTerm.start_date = moment(eTerm.start_date).format('YYYY-MM-DD').toString();
        }
        if (typeof eTerm.end_date !== 'string' && eTerm.end_date != null) {
            eTerm.end_date = moment(eTerm.end_date).format('YYYY-MM-DD').toString();
        }

        // I need to set the setting now to match the schedule name flagboi
        var settings = $scope.scheduleSettingsLookup[eTerm.schedule.id];
        eTerm.settings = settings.id;

        var newTerm = Object.assign({}, $scope.eTerms[termId]);
        delete newTerm.id;
        delete newTerm.schedule;
        termService.updateTerm(termId, newTerm).then(
            function success(response) {
                // update $scope.terms
                var term = response.term;
                var term = response.term;
                var termSetting = $scope.termSettingsLookup[term.settings];
                var termSchedule = $scope.schedulesLookup[termSetting.schedule];
                term.schedule = termSchedule;

                for (var i = 0; i < $scope.terms.length; i++) {
                    if ($scope.terms[i].id === termId) {
                        $scope.terms[i] = term;
                    }
                }
                $scope.termsLookup[term.id] = term;
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
                $scope.schedulesLookup[response.daily_schedule.id] = response.daily_schedule;
                $scope.removeEdit(index, 'schedule');
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save your edit." + errorResponse());
            }
        );
    };

    /**
     * Updates a school year
     * @param {number} holidayId - id of school year to be updated.
     */
    $scope.updateSchoolYear = function(yearId, index) {
        var eSchoolYear = $scope.eSchoolYears[yearId];
        if (typeof eSchoolYear.start_date !== 'string' && eSchoolYear.start_date != null) {
            eSchoolYear.start_date = moment(eSchoolYear.start_date).format('YYYY-MM-DD').toString();
        }
        if (typeof eSchoolYear.end_date !== 'string' && eSchoolYear.end_date != null) {
            eSchoolYear.end_date = moment(eSchoolYear.end_date).format('YYYY-MM-DD').toString();
        }
        var newSchoolYear = Object.assign({}, eSchoolYear);
        delete newSchoolYear.id;
        schoolYearService.updateSchoolYear(yearId, newSchoolYear).then(
            function success(response) {
                // update $scope.holidays
                for (var i = 0; i < $scope.schoolYears.length; i++) {
                    if ($scope.schoolYears[i].id === yearId) {
                        $scope.schoolYears[i] = response.school_year;
                    }
                }
                $scope.removeEdit(index, 'schoolYear');
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
