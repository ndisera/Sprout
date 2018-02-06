app.factory("caseManagerService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get case manager
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getCaseManager: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/managers/case' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Assign a case manager to a student
         * @param {caseManager} caseManagerObj - the caseManager object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        assignCaseManager: function (caseManagerObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/managers/case',
                data: caseManagerObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update caseManager record
         * @param {number} caseManagerRecordId - the caseManager record id.
         * @param {caseManagerRecord} caseManagerRecordObj - the caseManager record object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateCaseManager: function (caseManagerRecordId, caseManagerRecordObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + "/managers/case/" + caseManagerRecordId,
                data: caseManagerRecordObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },
    };
});
