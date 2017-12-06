app.factory("behaviorService", function ($http) {
    return {
        getBehavior: function () {
            return $http({
                method: 'GET',
                url: 'http://localhost:8000/behaviors/'
            }).then(function successCallback(response) {
                return response;
            }, function errorCallback(response) {
                return response;
            });

            // return $q.when("Hello World!");
        }
    };
});