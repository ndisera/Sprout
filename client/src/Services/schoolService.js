app.factory("schoolService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get schools
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getSchools: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/settings/school' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update school
         * @param {number} schoolId - the school id.
         * @param {object} schoolObj - the object used to update the school.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateSchool: function (schoolId, schoolObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + '/settings/school/' + schoolId,
                data: schoolObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        }
    };
});
