app.factory("testService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get student test records, filtering by a start and end data
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getTestScores: function (config) {
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

        getTests: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/tests/standardized' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Add student test record
         * @param {object} testObj - the test score object.
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
         * Add new standardized test
         * @param {object} testObj - the test object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addTestScore: function (testObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/tests/standardized',
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

        /**
         * Update standardized test
         * @param {number} testId - the standardized test id.
         * @param {object} testObj - the standardized test object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateTest: function (testId, testObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + "/tests/standardized/" + testId,
                data: testObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Delete standardized test
         * @param {number} testId - the test id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        deleteTest: function (testId) {
            var deferred = $q.defer();
            $http({
                method: 'DELETE',
                url: 'https://' + $rootScope.backend + '/tests/standardized/' + testId,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        }
    };
});
