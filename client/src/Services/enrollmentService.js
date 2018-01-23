app.factory("enrollmentService", function ($rootScope, $http) { 
    return {
        /**
         * Get student section enrollments
         * @param {number} studentId - the student's id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getStudentEnrollments: function (studentId) {
            return $http({
                method: 'GET',
                headers: {'Authorization': 'JWT ' + $rootScope.JSONWebToken},
                url: 'https://' + $rootScope.backend + '/enrollments/?student=' + studentId
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        }
    };
});
