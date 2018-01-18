app.factory("behaviorService", function ($rootScope, $http) {
    return {
        /**
         * Get student behavior records, filtering by a start and end data
         * @param {number} studentId - the student's id.
         * @param {string} startDate - starting date bound to filter. formatted "YYYY-MM-DD".
         * @param {string} endDate - ending date bound to filter. formatted "YYYY-MM-DD".
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getStudentBehaviorByDate: function (studentId, startDate, endDate) {
            return $http({
                method: 'GET',
                url: 'http://' + $rootScope.backend
                        + '/behaviors/?student=' + studentId
                        + "&start_date=" + startDate
                        + "&end_date=" + endDate
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        },

        /**
         * Add student behavior record
         * @param {behavior} behaviorObj - the behavior object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addBehavior: function (behaviorObj) {
            return $http({
                method: 'POST',
                url: 'http://' + $rootScope.backend + '/behaviors/',
                data: behaviorObj
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        },

        /**
         * Update student behavior record
         * @param {number} behaviorId - the student behavior id.
         * @param {behavior} behaviorObj - the student behavior object.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateBehavior: function (behaviorId, behaviorObj) {
            return $http({
                method: 'PUT',
                url: 'http://' + $rootScope.backend + "/behaviors/" + behaviorId + '/',
                data: behaviorObj
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        },
    };
});
