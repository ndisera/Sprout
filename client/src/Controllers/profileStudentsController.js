app.controller("profileStudentsController", function ($scope, $q, $location, data) {
    $scope.location = $location;

    // I know the order because I specified it in the route
    var enrollmentData  = data[0];
    var caseManagerData = data[1];

    $scope.caseManagerStudents = caseManagerData.students;

    // set up the teacher's sections
    $scope.sections = {};
    _.each(enrollmentData.sections, function(elem) {
        $scope.sections[elem.id] = elem;
        $scope.sections[elem.id]['students'] = [];
    });

    // set up a lookup for all students related to the teacher
    var studentsLookup = {};
    _.each(enrollmentData.students, function(elem) {
        if(!_.has(studentsLookup, elem.id)) {
            studentsLookup[elem.id] = elem;
        }
    });
    _.each(caseManagerData.students, function(elem) {
        if(!_.has(studentsLookup, elem.id)) {
            studentsLookup[elem.id] = elem;
        }
    });

    // place all students in all class rosters that they belong to
    _.each(enrollmentData.enrollments, function(elem) {
        $scope.sections[elem.section]['students'].push(studentsLookup[elem.student]);
    });


    $scope.students = _.values(studentsLookup);
    var sections = _.values($scope.sections);

    // doing this so panels don't get pushed out of column by panels of varying height
    $scope.singleColumn = sections;
    $scope.doubleColumn = [[], [], ];
    $scope.tripleColumn = [[], [], [], ];

    for(var i = 0; i < sections.length; i += 2) {
        for(var j = 0; j < 2; j++) {
            if((i + j) < sections.length) {
                $scope.doubleColumn[j].push(sections[i + j]);
            }
        }
    }

    for(var i = 0; i < sections.length; i += 3) {
        for(var j = 0; j < 3; j++) {
            if((i + j) < sections.length) {
                $scope.tripleColumn[j].push(sections[i + j]);
            }
        }
    }


    $scope.studentSearch = {
        text: "",
    };

    /**
     * Filter used for students
     * @param {student} student - student to be filtered.
     */
    $scope.studentFilter = function(student) {
        if(_.find($scope.focusStudents, function(elem) { return elem.student === student.id; })) {
            return false;
        }
        if($scope.studentSearch.text === null || $scope.studentSearch.text === undefined) {
            return true;
        }
        var input = $scope.studentSearch.text.toUpperCase();
        var fullname = student.first_name + " " + student.last_name;
        if(student.student_id.toUpperCase().includes(input) || student.first_name.toUpperCase().includes(input) ||
            student.last_name.toUpperCase().includes(input) || student.birthdate.toUpperCase().includes(input) ||
            fullname.toUpperCase().includes(input)) {
            return true;
        }
        return false;
    }

});
