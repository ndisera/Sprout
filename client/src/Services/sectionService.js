app.factory("sectionService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get section
         * @param {number} sectionId - the section id.
         * @param {object} config - config object for query parameters 
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getSection: function (sectionId, config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/sections/' + sectionId + query
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        }
    };
});
