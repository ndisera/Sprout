app.controller("studentAttendanceController", function($scope, $routeParams, $location, toastService, data, student) {
    $scope.location = $location;
    $scope.student = student.student;
    $scope.sections = data.sections; // doing this just for length in html
    $scope.sectionsLookup = _.indexBy(data.sections, 'id');
    $scope.enrollmentsLookup = _.indexBy(data.enrollments, 'id');
    $scope.attendance = data.attendance_records;
    $scope.eventSources = [];
    $scope.events = [];

    // basically need to be able to display class name, message (tardy, absent, extracurricular, etc.), the date it takes place for the given student
    // then probably include a donut graph of this at the top or bottom of the calendar

    $scope.uiConfig = {
      calendar:{
        handleWindowResize: false,
        height: 500,
        header:{
          left:  'today prev,next',
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
        _.each($scope.attendance, function(elem){
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
});
