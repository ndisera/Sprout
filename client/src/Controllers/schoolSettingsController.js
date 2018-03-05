app.controller("schoolSettingsController", function($scope, $rootScope, $location, toastService, userService, holidays, terms, tests) {
    $scope.location = $location;
    $scope.holidays = holidays.holidays;
    $scope.tests = tests.standardized_tests;
    //$scope.tests = [];
    //$scope.terms = terms.terms;
    $scope.terms = [];
    $scope.editHolidays = {};
    $scope.editTests = {};

    // these are the properties I choose to display in the delete form
    function setItemProperties(item, type) {
        switch (type) {
            case "holiday":
                $scope.item = [
                    {title: 'Name', value: item.name},
                    {title: 'Begins', value: item.start_date},
                    {title: 'Ends', value: item.end_date},
                ];
                break;
            case "test":
                $scope.item = [
                    {title: 'Name', value: item.test_name},
                    {title: 'Min Score', value: item.min_score},
                    {title: 'Max Score', value: item.max_score}
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
    }

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

    $scope.setItem = function(item, type) {
        setItemProperties(item, type);
        $scope.itemType = type;
        $("#deleteItemModal").modal();
    };
});
