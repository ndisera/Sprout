app.controller("profileStudentsController", function ($scope, $location, termService, students, terms, data) {
    $scope.location = $location;

    // set up all students (this is for the filter box)
    $scope.students = students.students;

    // I know the order because I specified it in the route
    var enrollmentData  = data[0];
    var caseManagerData = data[1];

    $scope.caseManagerStudents = caseManagerData.students;

    // get all current terms and filter sections
    var currentTerms = termService.getAllCurrentTerms(terms.terms);
    var currentTermsLookup = _.indexBy(currentTerms, 'id');
    var sectionsInCurrentTerms = _.filter(enrollmentData.sections, function(elem) { return _.has(currentTermsLookup, elem.term); });

    // set up the teacher's sections
    $scope.sections = {};
    _.each(sectionsInCurrentTerms, function(elem) {
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

    // place all students in all class rosters that they belong to (if those sections are in the current term)
    _.each(enrollmentData.enrollments, function(elem) {
        if(_.has($scope.sections, elem.section)) {
            $scope.sections[elem.section]['students'].push(studentsLookup[elem.student]);
        }
    });

    // the sections array is what builds the caseload and class
    // panels. add the caseload as a fake 'section' and then
    // add all the sections.
    var sections = [];
    if(caseManagerData.students.length > 0) {
        sections.push({ title: 'Caseload', students: caseManagerData.students, });
    }
    _.each($scope.sections, function(elem) {
        sections.push(elem);
    });

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
