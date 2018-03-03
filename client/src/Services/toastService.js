app.factory("toastService", function () {
    return {
        success: function (message) {
            toastr.success(message, 'Success');
        },
        error: function (message) {
            toastr.error(message, 'Error');
        },
        warning: function (message) {
            toastr.warning(message, 'Warning');
        },
        info: function (message) {
            toastr.info(message, 'Info');
        },
    };
});

