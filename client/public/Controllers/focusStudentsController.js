app.controller("focusStudentsController", function ($scope, $location) {
    if (!JSON.parse(localStorage.getItem("loggedIn"))) {
        location.path('');
    }

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
});