app.factory("termService", function ($rootScope, $http, $q, queryService) {
    return {
        /**
         * Get terms
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getTerms: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/terms' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Get term settings
         * @param {object} config - config object for query parameters (see queryService)
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        getTermSettings: function (config) {
            var query = queryService.generateQuery(config);
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: 'https://' + $rootScope.backend + '/settings/terms' + query,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Add a term
         * @param {object} termObj - object to be added to terms.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addTerm: function (termObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/terms',
                data: termObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Add a term setting
         * @param {object} termSettingObj - object to be added to term settings.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        addTermSetting: function (termSettingObj) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: 'https://' + $rootScope.backend + '/settings/terms',
                data: termSettingObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Update term
         * @param {number} termId - the term id.
         * @param {object} termObj - the object used to update the term.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        updateTerm: function (termId, termObj) {
            var deferred = $q.defer();
            $http({
                method: 'PUT',
                url: 'https://' + $rootScope.backend + '/terms/' + termId,
                data: termObj,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * Delete term
         * @param {number} termId - the term id.
         * @return {promise} promise that will resolve with data or reject with response code.
         */
        deleteTerm: function (termId) {
            var deferred = $q.defer();
            $http({
                method: 'DELETE',
                url: 'https://' + $rootScope.backend + '/terms/' + termId,
            }).then(function success(response) {
                deferred.resolve(response.data);
            }, function error(response) {
                deferred.reject(response);
            });
            return deferred.promise;
        },

        /**
         * transform terms by making their dates moments
         * and sort them so the most current is first
         *
         * @param {array[terms]} terms - list of terms
         * @return {array[terms]} sorted list of transformed terms
         */
        transformAndSortTerms: function(terms) {
            _.each(terms, function(elem) {
                elem.start_date = moment(elem.start_date);
                elem.end_date   = moment(elem.end_date);
            });
            // sort so most current first
            return _.sortBy(terms, function(elem) { return -elem.start_date; });
        },

        /**
         * get largest, current term
         *
         * @param {array[terms]} terms - list of terms
         * @return {term} largest (date range) current term, null if none current
         */
        getLargestCurrentTerm: function(terms) {
            var selectedTerm = null;
            _.each(terms, function(elem) {
                var startDate = moment(elem.start_date);
                var endDate = moment(elem.end_date);
                if(moment() > startDate && moment() < endDate) {
                    // I have found a candidate
                    // but we want the biggest current term
                    if(selectedTerm === null) {
                        selectedTerm = elem;
                    }
                    else {
                        var selectedStartDate = moment(selectedTerm.start_date);
                        var selectedEndDate   = moment(selectedTerm.end_date);
                        var candidateStartDate = moment(elem.start_date);
                        var candidateEndDate   = moment(elem.end_date);
                        // take the bigger one
                        var curDelta = selectedEndDate - selectedStartDate;
                        var newDelta = candidateEndDate - candidateStartDate;
                        if(newDelta > curDelta) {
                            selectedTerm = elem;
                        }
                    }
                }
            });
            return selectedTerm;
        },

        /**
         * returns a list of all current (active) terms based on today's date.
         *
         * @param {array[terms]} terms - list of terms
         * @return {array[terms]} transformed list of all current terms
         */
        getAllCurrentTerms: function(terms) {
            var currentTerms = [];
            _.each(terms, function(elem) {
                var startDate = moment(elem.start_date);
                var endDate = moment(elem.end_date);
                if(moment() > startDate && moment() < endDate) {
                    // found one
                    currentTerms.push(elem);
                }
            });
            return currentTerms;
        },


    };
});
