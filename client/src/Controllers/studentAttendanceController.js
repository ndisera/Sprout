app.controller("studentAttendanceController", function($scope, $rootScope, $routeParams, $location, toastService, data, student) {
    $scope.location = $location;
    $scope.student = student.student;
    $scope.sections = data.sections; // doing this just for length in html
    $scope.sectionsLookup = _.indexBy(data.sections, 'id');
    $scope.enrollmentsLookup = _.indexBy(data.enrollments, 'id');
    $scope.attendance = data.attendance_records;
    $scope.eventSources = [];
    $scope.events = [];

    // order attendance by date
    $scope.sortedAttendance = _.sortBy($scope.attendance, 'date');

    /**
     * graph-related code
     */
    var graphStartDateKey = 'graphStartDate';
    var graphEndDateKey = 'graphEndDate';

    // calculate first and last days of school week
    $scope[graphStartDateKey] = moment().startOf('month');
    $scope[graphEndDateKey] = moment();

    // basically need to be able to display class name, message (tardy, absent, extracurricular, etc.), the date it takes place for the given student
    // then probably include a donut graph of this at the top or bottom of the calendar

    $scope.uiConfig = {
        calendar: {
            handleWindowResize: false,
            height: 500,
            header: {
                left: 'today prev,next',
                center: 'title',
                right: 'month,basicWeek,basicDay,listWeek'
            },
            editable: false,
            eventLimit: 2,
            // eventRedner: function(event, element) {
            //     element.find('.fc-title').append("<br/>" + event.description);
            // },
        }
    };

    function populateEvents() {
        _.each($scope.attendance, function(elem) {
            var className = $scope.sectionsLookup[$scope.enrollmentsLookup[elem.enrollment].section].title;
            var message = elem.description;
            $scope.events.push({
                title: className + ": " + message,
                start: elem.date.substring(0, 10),
                color: '#337ab7',
                // color: '#57bc90',
                // color: '#45B9BD',
            });
        });
        $scope.eventSources = [$scope.events];
    }

    populateEvents();

    $scope.classGraph = {
        data: [],
        labels: [],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: true,
                position: 'bottom',
            },
        },
        datasetOverride: {
            backgroundColor: _.map($rootScope.colors, function(elem) {
                return elem.setAlpha(0.2).toRgbString();
            }),
            hoverBackgroundColor: _.map($rootScope.colors, function(elem) {
                return elem.setAlpha(0.4).toRgbString();
            }),
            borderColor: _.map($rootScope.colors, function(elem) {
                return elem.setAlpha(0.7).toRgbString();
            }),
        },
    };

    $scope.typeGraph = {
        data: [],
        labels: [],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: true,
                position: 'bottom',
            },
        },
        datasetOverride: {
            backgroundColor: _.map($rootScope.colors, function(elem) {
                return elem.setAlpha(0.2).toRgbString();
            }),
            hoverBackgroundColor: _.map($rootScope.colors, function(elem) {
                return elem.setAlpha(0.4).toRgbString();
            }),
            borderColor: _.map($rootScope.colors, function(elem) {
                return elem.setAlpha(0.7).toRgbString();
            }),
        },
    };

    $scope.updateGraphs = function() {
        // grab between start date and end date
        var typeData = {};
        var classData = {};
        var elem = {};
        var newDate = {};
        // doing for here so I can call break, subject to change if too slow
        for (var i = 0; i < $scope.sortedAttendance.length; i++) {
            elem = $scope.sortedAttendance[i];
            newDate = moment(elem.date);
            if (newDate >= $scope.graphStartDate && newDate <= $scope.graphEndDate) {
                // set property to 1 if doesn't exist, increment value if it does
                if (_.has(typeData, elem.description)) {
                    typeData[elem.description]++;
                } else {
                    typeData[elem.description] = 1;
                }

                var title = $scope.sectionsLookup[$scope.enrollmentsLookup[elem.enrollment].section].title;

                if (_.has(classData, title)) {
                    classData[title]++;
                } else {
                    classData[title] = 1;
                }
            } else if (newDate > $scope.graphEndDate) {
                break;
            }
        }
        // update data and labels in typeGraph and classGraph
        $scope.typeGraph.data = [];
        $scope.typeGraph.labels = [];
        $scope.classGraph.data = [];
        $scope.classGraph.labels = [];
        for (var propertyName in typeData) {
            if (typeData.hasOwnProperty(propertyName)) {
                $scope.typeGraph.labels.push(propertyName);
                $scope.typeGraph.data.push(typeData[propertyName]);
            }
        }
        for (var propertyName in classData) {
            if (classData.hasOwnProperty(propertyName)) {
                $scope.classGraph.labels.push(propertyName);
                $scope.classGraph.data.push(classData[propertyName]);
            }
        }
    };

    // set default display data to this month
    $scope.updateGraphs();

    $scope.graphDateRangeChange = function(varName, newDate) {
        // update date
        $scope[varName] = newDate;

        // broadcast event to update min/max values
        if(varName === graphStartDateKey) {
            $scope.$broadcast('pickerUpdate', graphEndDateKey, { minDate: $scope[graphStartDateKey] });
        }
        else if(varName === graphEndDateKey) {
            $scope.$broadcast('pickerUpdate', graphStartDateKey, { maxDate: $scope[graphEndDateKey] });
        }

        $scope.updateGraphs();
    };
});
