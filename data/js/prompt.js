function setup(baseUrl, host) {
    if ($("#eyebrowse-frame").length) {
        $("#eyebrowse-frame").css("z-index", 999999999);
        return;
    }
    var size = 350;
    var height = 200;
    var settings =  {
        "z-index": 999999999,
        "border-style": "none",
        "width": size,
        "height": height,
        "position": "fixed",
        "right": "0px",
        "top": "0px",
    };
    var eyebrowseFrame = $("<iframe>").css(settings).attr("id", "eyebrowse-frame").attr("src", baseUrl + "/ext/?site=" + host);

    $("body").append(eyebrowseFrame);
}

self.port.on("prompt", function(data) {
    var baseUrl = data.baseUrl;
    var host = window.location.host;
    setup(baseUrl, host);
    
    window.addEventListener('message', function(e){
        var message = JSON.parse(e.data);
        message.action = "filterlist";
        message.url = host;
        self.port.emit("filterlist", JSON.stringify(message));
    }, false);
});