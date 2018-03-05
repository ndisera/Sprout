app.controller("schoolSettingsController", function($scope, $rootScope, $location, toastService, userService, holidays) {
    $scope.location = $location;
    $scope.terms = [];
    $scope.holidays = holidays.holidays;
    $scope.tests = [];

    $scope.editHolidays = {};

    /**
     * Make a selected holiday editable
     * @param {number} index - index of holiday to be edited (from ng-repeat).
     */
    $scope.editHoliday = function(index) {
        if (!_.has($scope.editHolidays, index) || $scope.editHolidays[index] == null) {
            $scope.editHolidays[index] = true;
            $("#holiday-row" + index).removeClass('pointer');
        }
    };

    /**
     * Cancel holiday edit
     * @param {number} index - index of holiday being edited (from ng-repeat).
     */
    $scope.cancelEditHoliday = function(index) {
        $scope.editHolidays[index] = null;
        $("#holiday-row" + index).addClass('pointer');
    };
});
