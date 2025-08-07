$(document).ready(function () {
    $(".clientAdmin").load("clientAdmin.html");
    $(".vendorRegister").load("vendorRegister.html");
    $(".ClientUser").load("clientUser.html");
    $(".Email").load("email.html");
    $(".MatchMaking").load("MatchMaking.html");

    $(".nav-item").click(function () {
        var target = $(this).attr("page-name");
        $(".page-content").hide();
        $("." + target).show();
    })
});