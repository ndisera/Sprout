app.controller("servicesController", function($scope, $rootScope, $location, toastService, serviceService, userService) {
    $scope.location = $location;
    $scope.serviceOptions = [];
    for (key in $rootScope.serviceTypeToName) {
        $scope.serviceOptions.push({
            type: key,
            name: $rootScope.serviceTypeToName[key]
        });
    }

    // sort it
    $scope.serviceOptions = _.sortBy($scope.serviceOptions, 'name');

    $scope.selectedService = $scope.serviceOptions[3];

    /**
     * Sets service and updates the results
     * @param {service} service - the new service
     */
    $scope.selectService = function(service) {
        $scope.selectedService = service;
        updateResults();
    };

    /**
     * Updates the list of students who have and have not taken the selected test
     */
    function updateResults() {
        $scope.students = [];
        var config = {
            include: ['student.*', ],
            filter: [{
                name: 'type',
                val: $scope.selectedService.type,
            }],
        };

        serviceService.getServices(config).then(
            function success(data) {
                // I was going to use one array and filter it but maybe it's easiest to just keep three arrays
                $scope.students = data.students != null ? data.students : [];
                var studentsLookup = _.indexBy($scope.students, 'id');
                // I just want to store two temp arrays of ids.
                var tempLookup1 = _.indexBy($scope.students, 'id');
                var tempLookup2 = _.indexBy($scope.students, 'id');

                $scope.fulfilledStudents = [];
                $scope.unfulfilledStudents = [];

                _.each(data.service_requirements, function(elem) {
                    if (elem.fulfilled && tempLookup1.hasOwnProperty(elem.student)) {
                        $scope.fulfilledStudents.push(tempLookup1[elem.student]);
                    } else if (!elem.fulfilled && tempLookup2.hasOwnProperty(elem.student)) {
                        $scope.unfulfilledStudents.push(tempLookup2[elem.student]);
                    }
                });
            },
            function error(response) {
                toastService.error('The server wasn\'t able to retrieve service records of this type.');
            }
        );
    }

    /**
     * Downloads the service report
     */
    $scope.downloadReport = function() {
        var currentDate = moment().format('YYYY-MM-DD').toString();
        var doc = new jsPDF('p', 'pt'); // was mm previous, 1 mm is 2.83465 pt
        doc.setFont('Times', 'normal');
        var scale = 2.83465;
        doc.addImage($rootScope.logoImgData, 'JPEG', 180 * scale, 15 * scale, 15 * scale, 15 * scale);

        doc.setFontSize(30);
        doc.text(15 * scale, 25 * scale, $scope.selectedService.name + ' Service Report');
        doc.setFontSize(12);
        doc.text(15 * scale, 33 * scale, "Generated on " + currentDate + " by " + userService.user.firstName + " " + userService.user.lastName);
        doc.setFontSize(18);

        var columns = ["Name", "Student ID"];
        var fulfilledRows = [];
        var unfulfilledRows = [];

        var fulfilledData = _.sortBy($scope.fulfilledStudents, 'last_name');
        _.each(fulfilledData, function(elem) {
            fulfilledRows.push([elem.first_name + " " + elem.last_name, elem.student_id]);
        });
        var unfulfilledData = _.sortBy($scope.unfulfilledStudents, 'last_name');
        _.each(unfulfilledData, function(elem) {
            unfulfilledRows.push([elem.first_name + " " + elem.last_name, elem.student_id]);
        });

        doc.text(15 * scale, 46 * scale, "Fulfilled:");
        doc.autoTable(columns, fulfilledRows, { startY: 50 * scale, showHeader: 'firstPage'});
        let first = doc.autoTable.previous;
        doc.setFont('Times', 'normal');
        doc.text(15 * scale, first.finalY + (12 * scale), "Unfulfilled:");
        doc.autoTable(columns, unfulfilledRows, { startY: first.finalY + (16 * scale), showHeader: 'firstPage'});
        doc.save($scope.selectedService.name + '_Service_' + currentDate + '.pdf');
    };

    /**
     * Navigates to student's services page
     */
    $scope.viewStudent = function(id) {
        $location.path('/student/' + id + '/services');
    };

    /**
     * Filter used for student results
     * @param {student} student - student to be filtered.
     * @param {string} input - the filter input.
     */
    function filterStudents(student, input) {
        var fullname = student.first_name + " " + student.last_name;
        if (student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }

    /**
     * Filter used for fulfilled results
     * @param {student} student - student to be filtered.
     */
    $scope.fulfilledFilter = function(student) {
        if ($scope.fulfilledSearch == null) {
            return true;
        }
        var input = $scope.fulfilledSearch.toUpperCase();
        return filterStudents(student, input);
    };

    /**
     * Filter used for unfulfilled results
     * @param {student} student - student to be filtered.
     */
    $scope.unfulFIlledFilter = function(student) {
        if ($scope.unfulfilledSearch == null) {
            return true;
        }
        var input = $scope.unfulfilledSearch.toUpperCase();
        return filterStudents(student, input);
    };

    // initialization
    updateResults();
});
