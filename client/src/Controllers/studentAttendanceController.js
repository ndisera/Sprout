app.controller("studentAttendanceController", function($scope, $rootScope, $window, uiCalendarConfig, $routeParams, $location, toastService, data, student) {
    $scope.location = $location;
    $scope.student = student.student;
    $scope.sections = data.sections; // doing this just for length in html
    $scope.sectionsLookup = _.indexBy(data.sections, 'id');
    $scope.enrollmentsLookup = _.indexBy(data.enrollments, 'id');
    $scope.attendance = data.attendance_records;
    $scope.eventSources = [];
    $scope.events = [];
    $scope.eventElements = [];

    $scope.currentView = $window.innerWidth < 768 ? "listWeek" : "month";

    // order attendance by date
    $scope.sortedAttendance = _.sortBy($scope.attendance, 'date');

    // graph-related code
    var graphStartDateKey = 'graphStartDate';
    var graphEndDateKey = 'graphEndDate';

    // calculate first day of month and current day
    $scope[graphStartDateKey] = moment().startOf('month');
    $scope[graphEndDateKey] = moment();

    function convertStringToNumber(str) {
        var total = 0;
        for (var i = 0; i < str.length; ++i) {
            total += str.charCodeAt(i);
        }
        return total;
    }

    // calendar settings
    $scope.uiConfig = {
        calendar: {
            //handleWindowResize: false,
            defaultView: $window.innerWidth < 768 ? 'listWeek' : 'month',
            height: 500,
            header: {
                left: 'today prev,next',
                center: 'title',
                right: 'month,basicWeek,basicDay,listWeek'
            },
            editable: false,
            // themeSystem: 'bootstrap3',
            eventRender: function(event, element) {
                $scope.eventElements.push({ el: element, title: event.title});
            },
            viewRender: function(view, element) {
                _.each($scope.eventElements, function(elem) {
                    if (view.name === "month" || view.name === "basicWeek") {
                        elem.el.attr('data-toggle', 'tooltip');
                        elem.el.attr('data-container', 'body');
                        elem.el.prop('title', elem.title);
                        elem.el.tooltip();
                    }
                });
                $scope.eventElements = [];
            },
            eventLimit: true,
            allDaySlot: false
        }
    };

    // graph grouped by class
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

    // graph grouped by type
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

    /**
     * Sets up calendar events
     */
    function populateEvents() {
        _.each($scope.attendance, function(elem) {
            var className = $scope.sectionsLookup[$scope.enrollmentsLookup[elem.enrollment].section].title;
            var message = elem.description;
            var color = $rootScope.calendarColors[convertStringToNumber(elem.short_code) % ($rootScope.calendarColors.length - 1)];
            var textColor = '#fff';
            var borderColor = tinycolor(color).clone().setAlpha(0.5).toRgbString();
            var backgroundColor = tinycolor(color).clone().setAlpha(1).toRgbString();
            $scope.events.push({
                title: className + ": " + message,
                start: moment(elem.date).format('YYYY-MM-DD').toString(),
                // color: '#337ab7',
                textColor: textColor,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
            });
        });
        $scope.eventSources = [$scope.events];
    }

    /**
     * Updates the attendance doughnut charts
     */
    function updateGraphs() {
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
    }

    /**
     * Updates datepickers and charts to reflect date change
     * @param {string} varName - the scope variable name
     * @param {date} newDate - the new date selected
     */
    $scope.graphDateRangeChange = function(varName, newDate) {
        // update date
        $scope[varName] = newDate;

        // broadcast event to update min/max values
        if (varName === graphStartDateKey) {
            $scope.$broadcast('pickerUpdate', graphEndDateKey, {
                minDate: $scope[graphStartDateKey]
            });
        } else if (varName === graphEndDateKey) {
            $scope.$broadcast('pickerUpdate', graphStartDateKey, {
                maxDate: $scope[graphEndDateKey]
            });
        }

        updateGraphs();
    };

    $scope.adjustCalendarOnResize = function() {
        if ($window.innerWidth < 768) {
            uiCalendarConfig.calendars.attendanceCalendar.fullCalendar('changeView', 'listWeek');
        }
    }

    angular.element($window).bind('resize', $scope.adjustCalendarOnResize);

    // initialization

    // fill in the calendar
    populateEvents();

    // update the attendance charts
    updateGraphs();
});
