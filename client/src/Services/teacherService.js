app.factory("teacherService", function ($rootScope, $http) {
    return {
        /**
         * Get all teacher records
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getTeachers: function () {
            return $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/teachers/'
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        },

        /**
         * Get teacher record
         * @param {number} teacherId - the teacher's id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getTeacher: function (teacherId) {
            return $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/teachers/' + teacherId
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        },

        /**
         * Delete teacher record
         * @param {number} teacherId - the teacher's id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        deleteTeacher: function (teacherId) {
            return $http({
                method: 'DELETE',
                url: 'https://' + $rootScope.backend + '/teachers/' + teacherId
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        },

        /**
         * Add teacher record
         * @param {teacher} teacherObj - the teacher object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addTeacher: function (teacherObj) {
            return $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/teachers/',
                data: teacherObj
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        },

        /**
         * Update teacher record
         * @param {number} teacherId - the teacher's id.
         * @param {teacher} teacherObj - the teacher object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateTeacher: function (teacherId, teacherObj) {
            return $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + '/teachers/' + teacherId + "/",
                data: teacherObj
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        }
    };
});