app.factory("studentService", function ($rootScope, $http, $q, $window, queryService) {

    var studentInfo = {
        students: [],
        studentsLookup: {}
    };

    /**
     * Subscribe to authentication events to know when it's
     * safe to get students and necessary to clear out students.
     */
    $rootScope.$on('user:auth', function(event, data) {
        if(data.type === 'login') {
            refreshStudents();
        }
        else if(data.type === 'logout') {
            clearStudents();
        }
    });

    /**
     * Clear students data from service. Security measure.
     *
     * @return {void}
     */
    function clearStudents() {
        studentInfo.students = [];
        studentInfo.studentsLookup = {};
    }

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
            url: 'https://' + $rootScope.backend + '/students' + query,
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
            url: 'https://' + $rootScope.backend + '/students/' + studentId + query,
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
            url: 'https://' + $rootScope.backend + '/students/' + studentId,
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
            data: studentObj,
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
            data: studentObj,
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
     * @param {student} studentCollection - the student collection.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function updateStudents (studentCollection) {
        var deferred = $q.defer();
        $http({
            method: 'PATCH',
            url: 'https://' + $rootScope.backend + '/students/',
            data: studentCollection,
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
            clearStudents();
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Get a student's profile picture, if there is one.
     * @param {number} studentId - ID of the student
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with the base64 encoded image string OR null,
     *                   or reject with response
     */
    function getStudentPicture(studentId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/picture' + query,
        }).then(function success(response) {
            if(response.data.profile_pictures.length > 0 && response.data.profile_pictures[0].file !== undefined) {
                deferred.resolve(response.data.profile_pictures[0].file);
            }
            else {
                deferred.resolve(null);
            }
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Add picture to student profile 
     * @param {number} studentId - ID of the student
     * @param {picture} picture - the picture object. ex: { 'file': 'base64_encoded_string', }
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function addStudentPicture(studentId, picture) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/picture',
            data: picture,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Delete picture from student profile 
     * @param {number} studentId - ID of the student
     * @param {picture} pictureId - the ID of the picture
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function deleteStudentPicture(studentId, pictureId) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/picture/' + pictureId,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Get grades for a specific student
     * @param {number} studentId - ID of the student
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getGradesForStudent(studentId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/grades' + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Get behavior notes for a specific student
     * @param {number} studentId - ID of the student
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getBehaviorNotesForStudent(studentId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/behavior-notes/' + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Add an behavior note for a specific student
     * @param {number} studentId - the student's id.
     * @param {behaviorNote} behaviorNoteObj - the behavior note object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function addBehaviorNoteForStudent(studentId, behaviorNoteObj) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/behavior-notes/',
            data: behaviorNoteObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Update specific behavior note for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} behaviorNoteId - the behavior note's id.
     * @param {service} behaviorNoteObj - the behavior note object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function updateBehaviorNoteForStudent(studentId, behaviorNoteId, behaviorNoteObj) {
        var deferred = $q.defer();
        $http({
            method: 'PUT',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/behavior-notes/' + behaviorNoteId,
            data: behaviorNoteObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Delete specific behavior note for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} behaviorNoteId - the behavior note's id.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function deleteBehaviorNoteForStudent(studentId, behaviorNoteId) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/behavior-notes/' + behaviorNoteId,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Get services for a specific student
     * @param {number} studentId - ID of the student
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getServicesForStudent(studentId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/services' + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Get a specific service for a specific student
     * @param {number} studentId - ID of the student
     * @param {number} serviceId - ID of the service record
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getServiceForStudent(studentId, serviceId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/services/' + serviceId + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Add a service record for a specific student
     * @param {number} studentId - the student's id.
     * @param {service} serviceObj - the service object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function addServiceForStudent(studentId, serviceObj) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/services',
            data: serviceObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Update specific service record for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} serviceId - the service record's id.
     * @param {service} serviceObj - the service object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function updateServiceForStudent(studentId, serviceId, serviceObj) {
        var deferred = $q.defer();
        $http({
            method: 'PUT',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/services/' + serviceId,
            data: serviceObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Update specific service record for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} serviceId - the service record's id.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function deleteServiceForStudent(studentId, serviceId) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/services/' + serviceId,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Get ieps for a specific student
     * @param {number} studentId - ID of the student
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getIepsForStudent(studentId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps' + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Get specific iep for a specific student
     * @param {number} studentId - ID of the student
     * @param {number} iepId - ID of the iep
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getIepForStudent(studentId, iepId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps/' + iepId + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Add an iep for a specific student
     * @param {number} studentId - the student's id.
     * @param {service} serviceObj - the service object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function addIepForStudent(studentId, iepObj) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps',
            data: iepObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Update specific iep for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} iepId - the iep's id.
     * @param {service} iepObj - the iep object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function updateIepForStudent(studentId, iepId, iepObj) {
        var deferred = $q.defer();
        $http({
            method: 'PUT',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps/' + iepId,
            data: iepObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Delete specific iep for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} iepId - the iep's id.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function deleteIepForStudent(studentId, iepId) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps/' + iepId,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Get iep datas for a specific student
     * @param {number} studentId - ID of the student
     * @param {number} iepId - ID of the iep
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getIepDatasForStudent(studentId, iepId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps/' + iepId + '/data' + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Add an iep for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} iepId - the iep's id.
     * @param {service} iepDataObj - the iep data object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function addIepDataForStudent(studentId, iepId, iepDataObj) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps/' + iepId + '/data',
            data: iepDataObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Update specific iep data for a specific iep for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} iepId - the iep's id.
     * @param {number} iepDataId - the iep's id.
     * @param {service} iepDataObj - the iep data object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function updateIepDataForStudent(studentId, iepId, iepDataId, iepDataObj) {
        var deferred = $q.defer();
        $http({
            method: 'PUT',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps/' + iepId + '/data/' + iepDataId,
            data: iepDataObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Delete specific iep for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} iepId - the iep's id.
     * @param {number} iepDataId - the iep data's id.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function deleteIepDataForStudent(studentId, iepId, iepDataId) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps/' + iepId + '/data/' + iepDataId,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Get iep notes for a specific student
     * @param {number} studentId - ID of the student
     * @param {number} iepId - ID of the iep
     * @param {object} config - config object for query parameters (see queryService)
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function getIepNotesForStudent(studentId, iepId, config) {
        var query = queryService.generateQuery(config);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps/' + iepId + '/notes' + query,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Add an iep note for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} iepId - the iep's id.
     * @param {service} iepNoteObj - the iep data object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function addIepNoteForStudent(studentId, iepId, iepNoteObj) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps/' + iepId + '/notes',
            data: iepNoteObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Update specific iep note for a specific iep for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} iepId - the iep's id.
     * @param {number} iepNoteId - the iep's id.
     * @param {service} iepNoteObj - the iep data object.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function updateIepNoteForStudent(studentId, iepId, iepNoteId, iepNoteObj) {
        var deferred = $q.defer();
        $http({
            method: 'PUT',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps/' + iepId + '/notes/' + iepNoteId,
            data: iepNoteObj,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }

    /**
     * Delete specific iep note for a specific student
     * @param {number} studentId - the student's id.
     * @param {number} iepId - the iep's id.
     * @param {number} iepNoteId - the iep notes's id.
     * @return {promise} promise that will resolve with data or reject with response code.
     */
    function deleteIepNoteForStudent(studentId, iepId, iepNoteId) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: 'https://' + $rootScope.backend + '/students/' + studentId + '/ieps/' + iepId + '/notes/' + iepNoteId,
        }).then(function success(response) {
            deferred.resolve(response.data);
        }, function error(response) {
            deferred.reject(response);
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
        updateStudents: updateStudents,
        deleteStudent: deleteStudent,
        getStudentPicture: getStudentPicture,
        addStudentPicture: addStudentPicture,
        deleteStudentPicture: deleteStudentPicture,
        getGradesForStudent: getGradesForStudent,
        getBehaviorNotesForStudent: getBehaviorNotesForStudent,
        addBehaviorNoteForStudent: addBehaviorNoteForStudent,
        updateBehaviorNoteForStudent: updateBehaviorNoteForStudent,
        deleteBehaviorNoteForStudent: deleteBehaviorNoteForStudent,
        getServicesForStudent: getServicesForStudent,
        getServiceForStudent: getServiceForStudent,
        addServiceForStudent: addServiceForStudent,
        updateServiceForStudent: updateServiceForStudent,
        deleteServiceForStudent: deleteServiceForStudent,
        getIepsForStudent: getIepsForStudent,
        getIepForStudent: getIepForStudent,
        addIepForStudent: addIepForStudent,
        updateIepForStudent: updateIepForStudent,
        deleteIepForStudent: deleteIepForStudent,
        getIepDatasForStudent: getIepDatasForStudent,
        addIepDataForStudent: addIepDataForStudent,
        updateIepDataForStudent: updateIepDataForStudent,
        deleteIepDataForStudent: deleteIepDataForStudent,
        getIepNotesForStudent: getIepNotesForStudent,
        addIepNoteForStudent: addIepNoteForStudent,
        updateIepNoteForStudent: updateIepNoteForStudent,
        deleteIepNoteForStudent: deleteIepNoteForStudent,
    };
});
