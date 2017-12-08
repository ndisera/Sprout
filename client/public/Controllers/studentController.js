app.controller("studentController", function ($scope, $location, $http, $rootScope, $routeParams) {

    $scope.class_titles = [];
    $scope.classes = [];
    $scope.behaviors = [];
    // Both behavior and effort are arrays of lists of scores,
    // where each top-level array corresponds to a section
    $scope.hardcodedBehaviorForThePrototype = [];
    $scope.hardcodedEffortForThePrototype = [];
    // Section IDs are stored as a list of integers
    $scope.hardcodedSectionIDsForThePrototype = [];

    var x = $rootScope.student.id;

    // get student's classes
    $http({
        method: 'GET',
        url: 'http://localhost:8000/enrollments/?student=' + $rootScope.student.id
    }).then(function successCallback(response) {
        // enrollments will contain section id (for mapping to enrollments) and student id
        $scope.enrollments = response.data;
        $scope.classes = [];
        for (var i = 0; i < $scope.enrollments.length; i++) {
            $http({
                method: 'GET',
                url: 'http://localhost:8000/sections/' + $scope.enrollments[i].section + "/"
            }).then(function successCallback(response) {
                $scope.classes.push({
                    id: response.data.id,
                    title: response.data.title
                });
                $scope.class_titles.push(
                  response.data.title
                );
                var x = $scope.classes;
            }, function errorCallback(response) {
                $scope.status = response.status;
            });
        }
    }, function errorCallback(response) {
        $scope.status = response.status;
    });

    // the classes array should now contain objects with teacher and title


    // get behavior scores
    // pass in student, start date, and end date
    $scope.getBehaviors = function () {
        $http({
            method: 'GET',
            url: "http://localhost:8000/behaviors/?student=" + $rootScope.student.id + "&start_date=" + $scope.behaviorDate + "&end_date=" + $scope.behaviorDate
        }).then(function successCallback(response) {
            $scope.behaviors = response.data;
            $scope.classBehaviorScores = {};
            for (var i = 0; i < $scope.behaviors.length; i++) {
                $scope.classBehaviorScores[response.data[i].enrollment.section] = {
                    behavior: response.data[i].behavior,
                    effort: response.data[i].effort
                }
            }
            // now I should be able to match each behavior and effort score to each class
        }, function errorCallback(response) {
            $scope.status = response.status;
        });
    }

    // called when user inputs a new behavior/effort score
    $scope.changeBehaviors = function (classId) {
        if ($scope.classBehaviorScores === undefined)
            return;
        // change my class in scope.classes locally
        var newBehavior = {
            "date": $scope.behaviorDate,
            "enrollment": classId,
            "effort": document.getElementById("effort-" + classId).value,
            "behavior": document.getElementById("behavior-" + classId).value
        };
        for (var i = 0; i < $scope.classes.length; i++) {
            if ($scope.classes[i].id === classId) {
                var x = $scope.classBehaviorScores[classId].id;
                // put if classBehaviorScores does contain id
                $http({
                    method: 'PUT',
                    url: "http://localhost:8000/behaviors/" + $scope.classBehaviorScores[classId].id + "/",
                    // going to post behavior object, grab from 
                    data: newBehavior
                }).then(function successCallback(response) {
                    $scope.classBehaviorScores[classId] = response.data;
                    var x = "got here";
                }, function errorCallback(response) {
                    $scope.status = response.status;
                    console.log(response);
                });
                return;
            }
        }
        // not contained, make a post, append to list first
        $http({
            method: 'POST',
            url: "http://localhost:8000/behaviors/",
            // going to post behavior object, grab from 
            data: newBehavior
        }).then(function successCallback(response) {
            $scope.classBehaviorScores[classId] = response.data;
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
        if (date.getDate() < 10) {
            day = "0" + date.getDate();
        }
        $scope.behaviorDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + day;
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
      // Use this skeleton as the body of the get
      var get_data = {
        "student": $rootScope.student.id,
        "start_date": "2017-12-04",
        "end_date": "2017-12-08"
      }

      $http({
        method: 'GET',
        url: "http://localhost:8000/behaviors/?student=" + get_data["student"] + "&start_date=" + get_data["start_date"] + "&end_date=" + get_data["end_date"]
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
            // If we have not started a behavior list for this class, start one now
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

        $scope.hardcodedSectionIDsForThePrototype = sections;
      }, function errorCallback(response)
      {
        $scope.status = response.status;
      });
    }
    
    getHardcodedPrototypeBehaviorAndEffort();

    $scope.data = [
    [65, 59, 80, 81, 56, 55, 40]
    ];
    $scope.graph_labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    $scope.onClick = function (points, evt) {
      console.log(points, evt);
    };
    $scope.options = {
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
