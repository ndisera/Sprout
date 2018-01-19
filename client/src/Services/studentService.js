app.factory("studentService", function ($rootScope, $http) {
    return {
        /**
         * Get all student records
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getStudents: function () {
            return $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/students/'
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        },

        /**
         * Get student record
         * @param {number} studentId - the student's id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getStudent: function (studentId) {
            return $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/students/' + studentId
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        },

        /**
         * Delete student record
         * @param {number} studentId - the student's id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        deleteStudent: function (studentId) {
            return $http({
                method: 'DELETE',
                url: 'https://' + $rootScope.backend + '/students/' + studentId
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        },

        /**
         * Add student record
         * @param {student} studentObj - the student object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addStudent: function (studentObj) {
            return $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/students/',
                data: studentObj
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        },

        /**
         * Update student record
         * @param {number} studentId - the student's id.
         * @param {student} studentObj - the student object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateStudent: function (studentId, studentObj) {
            return $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + '/students/' + studentId + '/',
                data: studentObj
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        }
    };
});
