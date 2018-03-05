app.factory("holidayService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get holidays
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getHolidays: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/holidays' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Add a holiday
         * @param {object} holidayObj - holiday to be added to terms.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addHoliday: function (holidayObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/holidays',
                data: holidayObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update holiday
         * @param {number} holidayId - the holiday id.
         * @param {object} holidayObj - the object used to update the holiday.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateHoliday: function (holidayId, holidayObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + '/holidays/' + holidayId,
                data: holidayObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Delete holiday
         * @param {number} holidayId - the holiday id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        deleteHoliday: function (holidayId) {
            var deferred = $q.defer();
            $http({
                method: 'DELETE',
                url: 'https://' + $rootScope.backend + '/holidays/' + holidayId,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        }
    };
});
