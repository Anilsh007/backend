$(document).ready(function () {
    $('.nav-item').on('click', function () {
        var pageName = $(this).attr('page-name');
        $('#content').load(pageName + '.html', function (response, status, xhr) {
            if (status == "error") {
                var msg = "Sorry but there was an error: ";
                $("#content").html(msg + xhr.status + " " + xhr.statusText);
            }
        })
    });
});