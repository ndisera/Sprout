app.factory("sectionService", function ($rootScope, $http) {
    return {
        /**
         * Get section
         * @param {number} sectionId - the section id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getSection: function (sectionId) {
            return $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/sections/' + sectionId + '/'
            }).then(function success(response) {
                return response.data;
            }, function error(response) {
                return response.status;
            });
        }
    };
});
