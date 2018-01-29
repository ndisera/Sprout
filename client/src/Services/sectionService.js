app.factory("sectionService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get section
         * @param {number} sectionId - the section id.
         * @param {object} config - config object for query parameters 
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getSection: function (sectionId, config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/sections/' + sectionId + query
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Add section
         * @param {object} sectionObj - object to be added.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addSection: function (sectionObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/sections/',
                data: sectionObj
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update section
         * @param {number} sectionId - the section id.
         * @param {object} sectionObj - object used to update.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateSection: function (sectionId, sectionObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + '/sections/' + sectionId,
                data: sectionObj
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Delete section
         * @param {number} sectionId - the section id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        deleteSection: function (sectionId) {
            var deferred = $q.defer();
            $http({
                method: 'DELETE',
                url: 'https://' + $rootScope.backend + '/sections/' + sectionId
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        }
    };
});
