app.factory("studentService", function ($rootScope, $http) {

    var studentInfo = {
        students: [],
        studentsLookup: {}
    };

    /**
     * Get all student records
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getStudents () {
        return $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students/'
        }).then(function success(response) {
            return response.data;
        }, function error(response) {
            return response.status;
        });
    }

    /**
     * Get student record
     * @param {number} studentId - the student's id.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getStudent (studentId) {
        return $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students/' + studentId
        }).then(function success(response) {
            return response.data;
        }, function error(response) {
            return response.status;
        });
    }

    /**
     * Delete student record
     * @param {number} studentId - the student's id.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function deleteStudent (studentId) {
        return $http({
            method: 'DELETE',
            url: 'https://' + $rootScope.backend + '/students/' + studentId
        }).then(function success(response) {
            return refreshStudents(response);
        }, function error(response) {
            return response.status;
        });
    }

    /**
     * Add student record
     * @param {student} studentObj - the student object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function addStudent (studentObj) {
        return $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/students/',
            data: studentObj
        }).then(function success(response) {
            return refreshStudents(response);
        }, function error(response) {
            return response.status;
        });
    }

    /**
     * Update student record
     * @param {number} studentId - the student's id.
     * @param {student} studentObj - the student object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function updateStudent (studentId, studentObj) {
        return $http({
            method: 'PUT',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/',
            data: studentObj
        }).then(function (response) {
            return refreshStudents(response);
        }, function error(response) {
            return response.status;
        });
    }

    /**
     * Update students and studentsLookup anytime they have changed in the database
     * @return {response} response of the http request used before calling this method.
     */
    function refreshStudents(response) {
        return getStudents().then(function (data) {
            studentInfo.students = data;
            for (var i = 0; i < studentInfo.students.length; ++i) {
                var lookupName = studentInfo.students[i].first_name + " " + studentInfo.students[i].last_name;
                studentInfo.studentsLookup[lookupName.toUpperCase()] = studentInfo.students[i];
            }
            // fixes an error in chrome debugger, but I don't think this will ever be the case
            if (typeof response === "undefined" || response === null || typeof response.data === "undefined") {
                return null;
            }
            return response.data;
        });
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