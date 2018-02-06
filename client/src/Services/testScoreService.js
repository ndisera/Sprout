app.factory("testScoreService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get student test records, filtering by a start and end data
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getStudentTestScores: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/standardized_test_scores' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Add student test record
         * @param {behavior} testObj - the behavior object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addTestScore: function (testObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/standardized_test_scores',
                data: testObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update student behavior record
         * @param {number} testId - the student test id.
         * @param {behavior} testObj - the student test object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateTestScore: function (testId, testObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + "/standardized_test_scores/" + testId,
                data: testObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },
    };
});
