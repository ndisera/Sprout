app.factory("feedbackService", function ($rootScope, $http, $q) {
    return {
        /**
         * add feedback
         * @param {feedback} feedbackObj - the feedback object
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addFeedback: function (feedbackObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/feedback',
                data: feedbackObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },
    };
});
