/*
    Call the eyebrowse server to get an iframe with a prompt
    Can either be a login or track type prompt. 
*/
function setup(baseUrl, promptType, host) {
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
    var eyebrowseFrame = $("<iframe>").css(settings).attr("id", "eyebrowse-frame").attr("src", baseUrl + "/ext/" +  promptType +"?site=" + host + "&src=firefox");

    $("body").append(eyebrowseFrame);
}


self.port.on("prompt", function(data) {
    var host = window.location.host;
    setup(data.baseUrl, data.type, host);
    if (data.action === "prompt") {
        setup(request.baseUrl, request.type, host);
        
        window.addEventListener("message", function(e){
            if (e.origin === request.baseUrl){
                var msg = JSON.parse(e.data);
                if (msg.action === "fade"){
                     $("#eyebrowse-frame").remove()
                } else {
                    msg.url = host;
                    self.port.emit("promptRes", JSON.stringify(msg));
                   
                }
            }
        }, false);
    }
});