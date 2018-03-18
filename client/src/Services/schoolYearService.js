app.factory("schoolYearService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get school years
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getSchoolYears: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/settings/years' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Add a school year
         * @param {object} yearObj - object to be added to school years.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addSchoolYear: function (yearObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/settings/years',
                data: yearObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update school year
         * @param {number} yearId - the school year id.
         * @param {object} yearObj - the object used to update the school year.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateSchoolYear: function (yearId, yearObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + '/settings/years/' + yearId,
                data: yearObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Delete school year
         * @param {number} yearId - the school year id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        deleteSchoolYear: function (yearId) {
            var deferred = $q.defer();
            $http({
                method: 'DELETE',
                url: 'https://' + $rootScope.backend + '/settings/years/' + yearId,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        }
    };
});
