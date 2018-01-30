app.factory("studentService", function ($rootScope, $http, $q, $window, queryService) {

    var studentInfo = {
        students: [],
        studentsLookup: {}
    };

    /**
     * Get all student records
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getStudents (config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students' + query
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Get student record
     * @param {number} studentId - the student's id.
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getStudent (studentId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend 
                    + '/students/' + studentId + query
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Delete student record
     * @param {number} studentId - the student's id.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function deleteStudent (studentId) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: 'https://' + $rootScope.backend + '/students/' + studentId
        }).then(function success(response) {
            refreshStudents().then(function success(data) {
                deferred.resolve(response.data);
            });
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Add student record
     * @param {student} studentObj - the student object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function addStudent (studentObj) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/students',
            data: studentObj
        }).then(function success(response) {
            refreshStudents().then(function success(data) {
                deferred.resolve(response.data);
            });
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Update student record
     * @param {number} studentId - the student's id.
     * @param {student} studentObj - the student object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function updateStudent (studentId, studentObj) {
        var deferred = $q.defer();
        $http({
            method: 'PUT',
            url: 'https://' + $rootScope.backend + '/students/' + studentId,
            data: studentObj
        }).then(function success(response) {
            refreshStudents().then(function success(data) {
                deferred.resolve(response.data);
            });
        }, function error(response) {
            deferred.reject(response);
        });
    }

    /**
     * Update students and studentsLookup anytime they have changed in the database
     * @return {response} response of the http request used before calling this method.
     */
    function refreshStudents() {
        var deferred = $q.defer();
        getStudents().then(function success(data) {
            studentInfo.students = data.students;
            studentInfo.studentsLookup = {};
            for (var i = 0; i < studentInfo.students.length; ++i) {
                var lookupName = studentInfo.students[i].first_name + " " + studentInfo.students[i].last_name;
                studentInfo.studentsLookup[lookupName.toUpperCase()] = studentInfo.students[i];
            }
            deferred.resolve(data);
        }, function error(response) {
            $window.location.reload();
            //deferred.reject(response);
        });
        return deferred.promise;
    }

    return {
        studentInfo: studentInfo,
        getStudents: getStudents,
        getStudent: getStudent,
        refreshStudents: refreshStudents,
        addStudent: addStudent,
        updateStudent: updateStudent,
        deleteStudent: deleteStudent
    };
});
