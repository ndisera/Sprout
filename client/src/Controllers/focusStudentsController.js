app.controller("focusStudentsController", function ($scope, students) {

    // set students if there are any
    $scope.students = [];
    if(students.students !== null && students.students !== undefined) {
        $scope.students = students.students;
    }

    $scope.editing = false;

    $scope.toggleEdit = function() {
        $scope.editing = !$scope.editing;
    };

    $scope.sortableOptions = {
        update: function(e, ui) {
            //TODO(gzuber): use dropindex to save to server
            console.log(ui.item.sortable.dropindex);
        },
    };


    //TODO(gzuber): add in check to not allow them to add more than 5 focus students







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
    ];
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







    $('.panel').on('mousedown', function () {
        $(this).css('cursor', 'move');
    }).on('mouseup', function () {
        $(this).css('cursor', 'auto');
    });
});
