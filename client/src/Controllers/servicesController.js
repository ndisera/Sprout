app.controller("servicesController", function($scope, $rootScope, $location, toastService, studentService, userService) {
    $scope.location = $location;
    $scope.results = [];
    $scope.serviceOptions = [];
    for (key in $rootScope.serviceTypeToName) {
        $scope.serviceOptions.push({
            type: key,
            name: $rootScope.serviceTypeToName[key]
        });
    }
    $scope.selectedService = $scope.serviceOptions[0];

    $scope.fulTypes = [{
            id: 1,
            type: "Any"
        },
        {
            id: 2,
            type: "Fulfilled"
        },
        {
            id: 3,
            type: "Unfulfilled"
        }
    ];
    $scope.selectedFulType = $scope.fulTypes[0];

    /**
     * Sets the fulfillment type and filters the results based off of it
     * @param {fulType} fulType - the new fulType
     */
    $scope.selectFulType = function(fulType) {
        $scope.selectedFulType = fulType;
        filterByFulfillment();
    };

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
        $scope.results = [];
        var config = {
            include: ['student.*', ],
            filter: [{
                name: 'type',
                val: $scope.selectedService.type,
            }],
        };

        studentService.getServices(config).then(
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

                filterByFulfillment();
            },
            function error(response) {
                toastService.error('The server wasn\'t able to retrieve service records of this type.');
            }
        );
    }

    /**
     * Changes what students are displayed based off of their service fulfillment status
     */
    function filterByFulfillment() {
        switch ($scope.selectedFulType.type) {
            case "Any":
                $scope.results = $scope.students;
                break;
            case "Fulfilled":
                $scope.results = $scope.fulfilledStudents;
                break;
            case "Unfulfilled":
                $scope.results = $scope.unfulfilledStudents;
                break;
            default:
                $scope.results = [];
        }
    }

    /**
     * Downloads the service report
     */
    $scope.downloadReport = function() {
        var currentDate = moment().format('YYYY-MM-DD').toString();
        var doc = new jsPDF('p', 'pt'); // was mm previous, 1 mm is 2.83465 pt
        var scale = 2.83465;

        doc.setFontSize(30);
        var title = $scope.selectedFulType.id === 1 ? '' : $scope.selectedFulType.type + ' ';
        doc.text(105 * scale, 25 * scale, title + $scope.selectedService.name + ' Service Report', 'center');
        doc.setFontSize(12);
        doc.text(105 * scale, 33 * scale, "Generated on " + currentDate + " by " + userService.user.firstName + " " + userService.user.lastName, 'center');
        doc.setFontSize(18);

        var columns = ["Name", "Student ID"];
        var rows = [];

        var rowData = _.sortBy($scope.results, 'last_name');
        _.each(rowData, function(elem) {
            rows.push([elem.first_name + " " + elem.last_name, elem.student_id]);
        });

        doc.text(15 * scale, 42 * scale, "Students:")
        doc.autoTable(columns, rows, { startY: 46 * scale, showHeader: 'firstPage', });
        doc.save($scope.selectedService.name + ' ' + title + currentDate + '.pdf');
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
     */
    $scope.studentsFilter = function(student) {
        if ($scope.resultsSearch == null) {
            return true;
        }
        var input = $scope.resultsSearch.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if (student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    };

    // initialization
    updateResults();
});
