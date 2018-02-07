app.factory("gradeService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get grades
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getGrades: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/grades' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },
    };
});
