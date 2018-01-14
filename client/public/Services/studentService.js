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
        }
    };
});
