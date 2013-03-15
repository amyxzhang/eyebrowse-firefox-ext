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
    console.log("data:::", JSON.stringify(data))
    if (data.action === "prompt") {
        var host = window.location.host;
        setup(data.baseUrl, data.type, host);
        
        window.addEventListener("message", function(e){
            if (e.origin === data.baseUrl){
                var msg = JSON.parse(e.data);
                console.log("MSG:::", JSON.stringify(msg))
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