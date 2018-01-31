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
        },

        /**
         * Add student section enrollment
         * @param {object} enrollmentObj - object to be added to enrollments.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addStudentEnrollment: function (enrollmentObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/enrollments',
                data: enrollmentObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update student section enrollment
         * @param {number} enrollmentId - the enrollment id.
         * @param {object} enrolmentObj - the object used to update the enrollment.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateStudentEnrollment: function (enrollmentId, enrollmentObj) {
            var deferred = $q.defer();
            $http({
                method: 'UPDATE',
                url: 'https://' + $rootScope.backend + '/enrollments/' + enrollmentId,
                data: enrollmentObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Delete student section enrollment
         * @param {number} enrollmentId - the enrollment id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        deleteStudentEnrollment: function (enrollmentId) {
            var deferred = $q.defer();
            $http({
                method: 'DELETE',
                url: 'https://' + $rootScope.backend + '/enrollments/' + enrollmentId,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        }
    };
});
