app.controller("studentServicesController", function($scope, $rootScope, $location, $routeParams, toastService, studentService, userService, student, services) {
    $scope.location = $location;

    $scope.student = student.student;

    $scope.services       = [];
    $scope.newService     = {};

    $scope.teachers       = [];
    $scope.teachersLookup = {};

    $scope.adding         = false;

    if(services !== null && services !== undefined) {
        if(services.service_requirements !== null && services.service_requirements !== undefined) {
            $scope.services = services.service_requirements;
        }
        if(services.sprout_users !== null && services.sprout_users !== undefined) {
            $scope.teachers = services.sprout_users;
            $scope.teachersLookup = _.indexBy(services.sprout_users, 'pk');
            $scope.teachersLookup[userService.user.id] = {
                email: userService.user.email,
                first_name: userService.user.firstName,
                last_name: userService.user.lastName,
                pk: userService.user.id,
            };
        }
    }

    // manipulate services
    _.each($scope.services, function(elem) {
        elem.editing                    = false;
        elem.title_temp                 = elem.title;
        elem.description_temp           = elem.description;
        elem.fulfilled_description_temp = elem.fulfilled_description;
        elem.type_temp                  = elem.type;

        addTeacherToService(elem);
    });

    // takes a service and adds a 'teacher' property of the teacher that
    // fulfilled the service, if the service is fulfilled
    function addTeacherToService(service) {
        // make sure each service knows who marked it fulfilled
        if(service.fulfilled === true && service.fulfilled_user !== null) {
            service.teacher = $scope.teachersLookup[service.fulfilled_user];
        }
    }


    // takes a service and returns a new object that represents
    // the same service in a format that the server expects
    function copyService(service) {
        return {
            id: service.id,
            student: service.student,
            title: service.title,
            description: service.description,
            fulfilled: service.fulfilled,
            fulfilled_date: service.fulfilled_date,
            fulfilled_description: service.fulfilled_description,
            fulfilled_user: service.fulfilled_user,
            type: service.type,
        };
    }

    // resets the "newService" to its default state.
    // "newService" is a scope variable used for the
    // "Add Service" form.
    function resetNewService() {
        $scope.newService = {
            student: $scope.student.id,
            title: '',
            description: '',
            fulfilled: 'No',
            fulfilled_date: null,
            fulfilled_user: null,
            fulfilled_description: '',
            type: '',
        };
    }

    $scope.toggleEditService = function(service) {
        service.editing = !service.editing;

        // if we hit cancel, then clear all changes
        if(!service.editing) {
            service.title_temp                 = service.title;
            service.description_temp           = service.description;
            service.fulfilled_description_temp = service.fulfilled_description;
            service.type_temp                  = service.type;
        }
    };

    $scope.toggleAdd = function(value) {
        $scope.adding = value;
        if(!value) {
            resetNewService();
        }
    };

    $scope.saveService = function(service) {
        var toSave = copyService(service);
        if(!service.fulfilled && (service.fulfilled_description_temp !== null && service.fulfilled_description_temp !== undefined && service.fulfilled_description_temp.trim() !== '')) {
            toSave.fulfilled             = true;
            toSave.fulfilled_date        = moment().format('YYYY-MM-DD').toString();
            toSave.fulfilled_description = service.fulfilled_description_temp;
            toSave.fulfilled_user        = userService.user.id;
        }
        else if(service.fulfilled && service.fulfilled_description_temp !== service.fulfilled_description) {
            toSave.fulfilled_date        = moment().format('YYYY-MM-DD').toString();
            toSave.fulfilled_description = service.fulfilled_description_temp;
            if(toSave.fulfilled_description === null || toSave.fulfilled_description === undefined || toSave.fulfilled_description.trim() === '') {
                toSave.fulfilled_description = null;
            }
            toSave.fulfilled_user        = userService.user.id;
        }

        toSave.title       = service.title_temp;
        toSave.description = service.description_temp;
        toSave.type        = service.type_temp;

        studentService.updateServiceForStudent(service.student, service.id, toSave).then(
            function success(data) {
                service.title                      = data.service_requirement.title;
                service.title_temp                 = data.service_requirement.title;
                service.description                = data.service_requirement.description;
                service.description_temp           = data.service_requirement.description;
                service.fulfilled                  = data.service_requirement.fulfilled;
                service.fulfilled_date             = data.service_requirement.fulfilled_date;
                service.fulfilled_description      = data.service_requirement.fulfilled_description;
                service.fulfilled_description_temp = data.service_requirement.fulfilled_description;
                service.fulfilled_user             = data.service_requirement.fulfilled_user;
                service.type                       = data.service_requirement.type;
                service.type_temp                  = data.service_requirement.type;

                addTeacherToService(service);

                if(service.editing) {
                    $scope.toggleEditService(service);
                }
            },
            function error(response) {
                toastService.error('The server wasn\'t able to save the service requirement.');
            },
        );
    };

    $scope.markFulfilled = function(service, fulfilled) {
        var toSave = copyService(service);
        if(fulfilled) {
            toSave.fulfilled             = true;
            toSave.fulfilled_date        = moment().format('YYYY-MM-DD').toString();
            toSave.fulfilled_description = service.fulfilled_description_temp;
            toSave.fulfilled_user        = userService.user.id;
        }
        else {
            toSave.fulfilled             = false;
            toSave.fulfilled_date        = null;
            toSave.fulfilled_description = null;
            toSave.fulfilled_user        = null;
        }

        studentService.updateServiceForStudent(service.student, service.id, toSave).then(
            function success(data) {
                service.fulfilled                  = data.service_requirement.fulfilled;
                service.fulfilled_date             = data.service_requirement.fulfilled_date;
                service.fulfilled_description      = data.service_requirement.fulfilled_description;
                service.fulfilled_description_temp = data.service_requirement.fulfilled_description;
                service.fulfilled_user             = data.service_requirement.fulfilled_user;

                addTeacherToService(service);
            },
            function error(response) {
                toastService.error('The server wasn\'t able to save the service requirement.');
            },
        );
    };

    $scope.deleteService = function(service) {
        studentService.deleteServiceForStudent($scope.student.id, service.id).then(
            function success(data) {
                var index = _.findIndex($scope.services, function(elem) { return elem.id === service.id; });
                if(index !== -1) {
                    $scope.services.splice(index, 1);
                }
            },
            function error(data) {
                toastService.error('The server wasn\'t able to delete the service.');
            },
        );
    };

    $scope.addService = function() {
        var toSave = copyService($scope.newService);
        if(toSave.fulfilled === 'Yes') {
            toSave.fulfilled             = true;
            toSave.fulfilled_date        = moment().format('YYYY-MM-DD').toString();
            if(toSave.fulfilled_description === '') {
                toSave.fulfilled_description = null;
            }
            toSave.fulfilled_user        = userService.user.id;
        }
        else {
            toSave.fulfilled             = false;
            toSave.fulfilled_date        = null;
            toSave.fulfilled_description = null;
            toSave.fulfilled_user        = null;
        }

        studentService.addServiceForStudent($scope.student.id, toSave).then(
            function success(data) {
                var newService = data.service_requirement;
                newService.editing                    = false;
                newService.title_temp                 = newService.title;
                newService.description_temp           = newService.description;
                newService.fulfilled_description_temp = newService.fulfilled_description;
                newService.type_temp                  = newService.type;

                addTeacherToService(newService);

                $scope.services.push(newService);
                resetNewService();
            },
            function error(data) {
                toastService.error('The server wasn\'t able to save your new service.');
            },
        );
    };

    resetNewService();

    //TODO(gzuber): uncomment this to enable tooltips
    //$(document).ready(function(){
        //$('[data-toggle="tooltip"]').tooltip();
    //});
});
