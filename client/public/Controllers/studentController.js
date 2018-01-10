app.controller("studentController", function ($scope, $location, $http, $rootScope, $routeParams) {

    $scope.section_titles = [];
    $scope.sections = [];
    $scope.behaviors = [];
    // used for experimenting with ng-options
    $scope.scores = [1, 2, 3, 4, 5];
    // Both behavior and effort are arrays of lists of scores,
    // where each top-level array corresponds to a section
    $scope.hardcodedBehaviorForThePrototype = [];
    $scope.hardcodedEffortForThePrototype = [];
    // Section IDs are stored as a list of integers
    $scope.hardcodedSectionIDsForThePrototype = [];

    // get student's sections
    $http({
        method: 'GET',
        url: 'http://'
            + $rootScope.backend
            + '/enrollments/?student=' + $rootScope.student.id
    }).then(function successCallback(response) {
        // enrollments will contain section id (for mapping to enrollments) and student id
        $scope.enrollments = response.data;
        $scope.sections = [];
        for (var i = 0; i < $scope.enrollments.length; i++) {
            $http({
                method: 'GET',
                url: 'http://'
                    + $rootScope.backend
                    + '/sections/' + $scope.enrollments[i].section + "/"
            }).then(function successCallback(response) {
                $scope.sections.push({
                    id: response.data.id,
                    title: response.data.title
                });
                $scope.section_titles.push(
                  response.data.title
                );
                var x = $scope.sections;
            }, function errorCallback(response) {
                $scope.status = response.status;
            });
        }
    }, function errorCallback(response) {
        $scope.status = response.status;
    });

    // the sections array should now contain objects with teacher and title


    // get behavior scores
    // pass in student, start date, and end date
    $scope.getBehaviors = function () {
        $http({
            method: 'GET',
            url: 'http://'
                    + $rootScope.backend
                    + '/behaviors/?student=' + $rootScope.student.id + "&start_date=" + $scope.behaviorDate + "&end_date=" + $scope.behaviorDate
        }).then(function successCallback(response) {
            $scope.behaviors = response.data;
            $scope.sectionBehaviorScores = {};
            for (var i = 0; i < $scope.behaviors.length; i++) {
                $scope.sectionBehaviorScores[response.data[i].enrollment.section] = response.data[i];
            }
            // now I should be able to match each behavior and effort score to each section
        }, function errorCallback(response) {
            $scope.status = response.status;
        });
    }

    // called when user inputs a new behavior/effort score
    $scope.changeBehaviors = function (sectionId) {
        if ($scope.sectionBehaviorScores === undefined)
            return;
        // change my section in scope.sections locally
        //console.log(newBehavior);
              var newBehavior = {
                  "date": $scope.behaviorDate,
                  "enrollment": null,
                  "effort": document.getElementById("effort-" + sectionId).value === "" ? null : document.getElementById("effort-" + sectionId).value,
                  "behavior": document.getElementById("behavior-" + sectionId).value === "" ? null : document.getElementById("behavior-" + sectionId).value
              };

        if($scope.sectionBehaviorScores[sectionId] !== undefined && $scope.sectionBehaviorScores[sectionId] !== null) {

              newBehavior.enrollment = $scope.sectionBehaviorScores[sectionId].enrollment.id;
              
                // put if sectionBehaviorScores does contain id
                $http({
                    method: 'PUT',
                    url: 'http://'
                        + $rootScope.backend
                        + "/behaviors/" + $scope.sectionBehaviorScores[sectionId].id + "/",
                    // going to post behavior object, grab from 
                    data: newBehavior
                }).then(function successCallback(response) {
                  var enrollment_obj = $scope.sectionBehaviorScores[sectionId].enrollment;
                  $scope.sectionBehaviorScores[sectionId] = response.data;
                  $scope.sectionBehaviorScores[sectionId].enrollment = enrollment_obj;

                  var date = new Date($scope.behaviorDate);
                  $scope.hardcodedEffortForThePrototype[sectionId-1][date.getDay()] = $scope.sectionBehaviorScores[sectionId].effort;
                  $scope.hardcodedBehaviorForThePrototype[sectionId-1][date.getDay()] = $scope.sectionBehaviorScores[sectionId].behavior;
                }, function errorCallback(response) {
                    $scope.status = response.status;
                });
                return;
        }


      var enrollment_obj;
        for(var j = 0; j < $scope.enrollments.length; ++j) {
            if($scope.enrollments[j].section === sectionId) {
              enrollment_obj = $scope.enrollments[j];
              newBehavior.enrollment = $scope.enrollments[j].id;
            }
        }

        // not contained, make a post, append to list first
        $http({
            method: 'POST',
            url: 'http://'
                + $rootScope.backend
                + '/behaviors/',
            // going to post behavior object, grab from 
            data: newBehavior
        }).then(function successCallback(response) {
          $scope.sectionBehaviorScores[sectionId] = response.data;
          $scope.sectionBehaviorScores[sectionId].enrollment = enrollment_obj;
          //getHardcodedPrototypeBehaviorAndEffort();
        }, function errorCallback(response) {
            $scope.status = response.status;
        });
    }

    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }

    $('#datepicker').datepicker({
        format: "yyyy-mm-dd"
    });

    function defaultDate() {
        var date = new Date();
        // prepend 0 to single digit day
        var day = "";
        date.getDate() < 10 ? day = "0" + date.getDate() : day = date.getDate();
        var month = "";
        date.getMonth() + 1 < 10 ? month = "0" + (date.getMonth() + 1) : month = date.getMonth() + 1;
        console.log(day);
        $scope.behaviorDate = date.getFullYear() + "-" + month + "-" + day;
    }

    defaultDate();

    // called when date in datepicker is changed
    $scope.changeDate = function () {
        $scope.behaviorDate = document.getElementById('datepicker').value;
        $scope.getBehaviors();
    }

    $('#datepicker').datepicker().on('changeDate', function (ev) {
        $scope.changeDate();
    });
    
    function getHardcodedPrototypeBehaviorAndEffort()
    {
      $scope.hardcodedBehaviorForThePrototype = [];
      $scope.hardcodedEffortForThePrototype = [];
      $scope.hardcodedSectionIDsForThePrototype = [];
      
      // Use this skeleton as the body of the get
      var get_data = {
        "student": $rootScope.student.id,
        "start_date": "2017-12-11",
        "end_date": "2017-12-15"
      }

      $http({
        method: 'GET',
        url: 'http://'
            + $rootScope.backend
            + '/behaviors/?student=' + get_data["student"] + "&start_date=" + get_data["start_date"] + "&end_date=" + get_data["end_date"]
      }).then(function successCallback(response)
      {
        var behaviors = {};
        var efforts = {};
        var sections = [];
        for (var index = 0; index < response.data.length; index++)
        {
          var section_id = response.data[index]["enrollment"]["section"];
          if (behaviors[section_id] == undefined)
          {
            // If we have not started a behavior list for this section, start one now
            behaviors[section_id] = [];
            efforts[section_id] = [];
            sections.push(section_id)
          }
          behaviors[section_id].push(response.data[index].behavior);
          efforts[section_id].push(response.data[index].effort);
        }
        
        // Convert to global arrays
        for (var index = 0; index < sections.length; index++)
        {
          $scope.hardcodedBehaviorForThePrototype.push(behaviors[sections[index]]);
          $scope.hardcodedEffortForThePrototype.push(efforts[sections[index]]);
        }

        console.log($scope.hardcodedEffortForThePrototype);
        console.log($scope.hardcodedBehaviorForThePrototype);

        $scope.hardcodedSectionIDsForThePrototype = sections;
      }, function errorCallback(response)
      {
        $scope.status = response.status;
      });
    }
    
    getHardcodedPrototypeBehaviorAndEffort();

    $scope.graph_labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    $scope.onClick = function (points, evt) {
      console.log(points, evt);
    };
    $scope.datasetOverride = [
    {
      lineTension: 0.2,

      label: "CS5510",
      fill: false,

      backgroundColor: 'rgba(255,99,132,0.4)',
      pointBackgroundColor: 'rgba(255,99,132,0.4)',
      pointHoverBackgroundColor: 'rgba(255,99,132,0.4)',
      borderColor: 'rgba(255,99,132,1)',
      pointBorderColor: 'rgba(255,99,132,0.6)',
      pointHoverBorderColor: 'rgba(255,99,132,1)'
    },
    {
      lineTension: 0.2,

      label: "CS4400",
      fill: false,

      backgroundColor: 'rgba(100,150,255,0.4)',
      pointBackgroundColor: 'rgba(100,150,255,0.4)',
      pointHoverBackgroundColor: 'rgba(100,150,255,0.4)',
      borderColor: 'rgba(100,150,255,1)',
      pointBorderColor: 'rgba(100,150,255,0.6)',
      pointHoverBorderColor: 'rgba(100,150,255,1)'
    }
    ];
    $scope.options = {
      responsive: true,
      maintainAspectRatio: false,
      scales:{
        yAxes: [{
          display: true,
          ticks: {
            min: 1,
            stepSize: 1,
            max: 5
          }
        }]
      },
      legend:
      {
        display: true
      }
    };
});
