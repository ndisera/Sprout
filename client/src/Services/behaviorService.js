app.factory("behaviorService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get student behavior records, filtering by a start and end data
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getStudentBehavior: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/behaviors' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Add student behavior record
         * @param {behavior} behaviorObj - the behavior object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addBehavior: function (behaviorObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/behaviors',
                data: behaviorObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update student behavior record
         * @param {number} behaviorId - the student behavior id.
         * @param {behavior} behaviorObj - the student behavior object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateBehavior: function (behaviorId, behaviorObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + "/behaviors/" + behaviorId,
                data: behaviorObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },
    };
});
