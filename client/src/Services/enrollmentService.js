app.factory("enrollmentService", function ($rootScope, $http, $q, queryService) { 
    return {
        /**
         * Get student section enrollments
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getStudentEnrollments: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/enrollments' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        }
    };
});
