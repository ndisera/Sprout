app.factory("teacherService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get all teacher records
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getTeachers: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/teachers' + query
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Get teacher record
         * @param {number} teacherId - the teacher's id.
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getTeacher: function (teacherId, config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/teachers/' + teacherId + query
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Delete teacher record
         * @param {number} teacherId - the teacher's id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        deleteTeacher: function (teacherId) {
            var deferred = $q.defer();
            $http({
                method: 'DELETE',
                url: 'https://' + $rootScope.backend + '/teachers/' + teacherId
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Add teacher record
         * @param {teacher} teacherObj - the teacher object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addTeacher: function (teacherObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/teachers',
                data: teacherObj
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update teacher record
         * @param {number} teacherId - the teacher's id.
         * @param {teacher} teacherObj - the teacher object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateTeacher: function (teacherId, teacherObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + '/teachers/' + teacherId + "/",
                data: teacherObj
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        }
    };
});
