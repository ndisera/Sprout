app.factory("termService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get terms
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getTerms: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/terms' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Get term settings
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getTermSettings: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/settings/terms' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Add a term
         * @param {object} termObj - object to be added to terms.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addTerm: function (termObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/terms',
                data: termObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update term
         * @param {number} termId - the term id.
         * @param {object} termObj - the object used to update the term.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateTerm: function (termId, termObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + '/terms/' + termId,
                data: termObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Delete term
         * @param {number} termId - the term id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        deleteTerm: function (termId) {
            var deferred = $q.defer();
            $http({
                method: 'DELETE',
                url: 'https://' + $rootScope.backend + '/terms/' + termId,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        }
    };
});
