app.factory("scheduleService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get schedules
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getSchedules: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/settings/schedules' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Add a schedule
         * @param {object} scheduleObj - object to be added to schedules.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addSchedule: function (scheduleObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/settings/schedules',
                data: scheduleObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update schedule
         * @param {number} scheduleId - the schedule id.
         * @param {object} scheduleObj - the object used to update the schedule.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateSchedule: function (scheduleId, scheduleObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + '/settings/schedules/' + scheduleId,
                data: scheduleObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Delete schedule
         * @param {number} scheduleId - the schedule id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        deleteSchedule: function (scheduleId) {
            var deferred = $q.defer();
            $http({
                method: 'DELETE',
                url: 'https://' + $rootScope.backend + '/settings/schedules/' + scheduleId,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        }
    };
});
