app.controller('feedbackController', function ($scope, $rootScope, $location, toastService, userService, feedbackService) {
    $scope.location = $location;

    /**
     * Checks if input is null, undefined, NaN, or blank. Used to verify
     * content of email and password fields.
     *
     * @param {string} input - input to verify
     *
     * @return {boolean} - whether or not it's valid
     */
    function validateInput(input) {
        if(input === null 
            || input === undefined 
            || input === NaN
            || input === "") 
        {
            return false;
        }
        return true;
    }

    $scope.clearFeedback = function() {
        $scope.feedbackBody = '';
        $scope.anonymous = false;
    };

    $scope.addFeedback = function() {
        if(!validateInput($scope.feedbackBody)) {
            toastService.info('Feedback is blank.');
            return;
        }

        var feedback = {
            user: null,
            body: $scope.feedbackBody,
        };

        if(!$scope.anonymous) {
            feedback.user = userService.user.id;
        }

        feedbackService.addFeedback(feedback).then(
            function success(response) {
                toastService.success('Thanks for your feedback!');
            }, function error(response) {
                toastService.error('Something went wrong... The server wasn\'t able to save your feedback. Please try again later, we definitely want to hear from you!');
            }
        );
    };

});
