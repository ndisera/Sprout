app.controller("schoolSettingsController", function($scope, $rootScope, $location, toastService, userService, holidays, terms, tests, holidayService, testService) {
    $scope.location = $location;
    $scope.holidays = holidays.holidays;
    $scope.tests = tests.standardized_tests;
    //$scope.tests = [];
    //$scope.terms = terms.terms;
    $scope.terms = [];
    $scope.editHolidays = {};
    $scope.editTests = {};

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
    }

    setupLookups();

    /**
     * Sets up properties of the item to display in the delete form
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
                break;
        }
    }

    /**
     * Make a selected item editable
     * @param {number} index - index of item to be edited (from ng-repeat).
     * @param {string} item - type of item to be edited.
     */
    $scope.edit = function(index, item) {
        switch (item) {
            case "holiday":
                if (!_.has($scope.editHolidays, index) || $scope.editHolidays[index] == null) {
                    $scope.editHolidays[index] = true;
                    $("#holiday-row" + index).removeClass('pointer');
                }
                break;
            case "test":
                if (!_.has($scope.editTests, index) || $scope.editTests[index] == null) {
                    $scope.editTests[index] = true;
                    $("#test-row" + index).removeClass('pointer');
                }
                break;
            case "term":
                break;
        }
    };

    /**
     * Cancel item edit
     * @param {number} index - index of item being edited (from ng-repeat).
     * @param {string} item - type of item being edited.
     */
    $scope.cancelEdit = function(index, item) {
        switch (item) {
            case "holiday":
                $scope.editHolidays[index] = null;
                $("#holiday-row" + index).addClass('pointer');
                break;
            case "test":
                $scope.editTests[index] = null;
                $("#test-row" + index).addClass('pointer');
                break;
            case "term":
                break;
        }
    };

    /**
     * Displays delete modal with item and itemType
     */
    $scope.setItem = function(item, type) {
        setItemProperties(item, type);
        $scope.itemType = type;
        $scope.itemId = item.id;
        $("#deleteItemModal").modal();
    };

    $scope.deleteItem = function(id, type) {
        switch (type) {
            case "holiday":
                deleteHoliday(id);
                break;
            case "test":
                deleteTest(id);
                break;
            case "term":
                break;
        }
    }

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

    $scope.addHoliday = function() {

    };

    $scope.addTest = function() {

    };

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
                $scope.cancelEdit(index, 'holiday')
            },
            function error(response) {
                setErrorMessage(response);
                toastService.error("The server was unable to save your edit." + errorResponse());
            }
        );
    };

    $scope.updateTest = function(testId) {
        var newTest = Object.assign({}, $scope.eTests[testId]);
        delete newTest.id;
        testService.updateTest(testId, newTest).then(
            function success(response) {
                // update $scope.tests
                for (var i = 0; i < $scope.tests.length; i++) {
                    if ($scope.tests[i].id === testId) {
                        $scope.tests[i] = response.test;
                    }
                }
                $scope.cancelEdit(index, 'test')
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
