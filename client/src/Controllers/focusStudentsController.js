app.controller("focusStudentsController", function ($scope, $rootScope, $location, students) {

    // redirect user if not logged in
    if (!$rootScope.loggedIn) {
        location.path = '';
    }
    
    $scope.students = students;

    // draggable 
    $('.row').sortable({
        connectWith: ".panel",
        handle: ".panel-heading",
        placeholder: "panel-placeholder",
        start: function (e, ui) {
            ui.placeholder.width(ui.item.find('.panel').width());
            ui.placeholder.height(ui.item.find('.panel').height());
            ui.placeholder.addClass(ui.item.attr("class"));
        }
    });

    $('.panel').on('mousedown', function () {
        $(this).css('cursor', 'move');
    }).on('mouseup', function () {
        $(this).css('cursor', 'auto');
    });

    // All of the following belongs to the hard-coded angular-charts on the Focus Students page
    $scope.focus_labels = ["January", "February", "March", "April", "May", "June", "July"];
    $scope.focus_data = [
    [28, 48, 40, 19, 86, 27, 90]
    ];
    $scope.progress_labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    $scope.progress_data = [
    [2, 3, 3, 4, 5]
    ];
    $scope.progress_colours = ["rgba(80,255,80,1)"]
    $scope.caution_labels = ["Math", "Reading", "Music", "History", "Spanish"];
    $scope.caution_data = [
    [77, 81, 66, 50, 35]
    ];
    $scope.caution_colours = [
      "rgba(255,99,132,1)"
    ]
    $scope.onClick = function (points, evt) {
      console.log(points, evt);
    };
    $scope.options = {
      responsive: true,
      maintainAspectRatio: false
    };
    $scope.options_behavior = {
      responsive: true,
      maintainAspectRatio: false,
      scales:{
        yAxes: [{
          display: true,
          ticks: {
            min: 1,
            max: 5
          }
        }]
      }
    };
});
