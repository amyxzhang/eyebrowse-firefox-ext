function sendMessage(action) {
    var message = {
            'type': action,
    };
    self.port.emit("idle", JSON.stringify(message));
}


self.port.on("idle", function(data) {
    /*
        https://github.com/jasonmcleod/jquery.idle
        Detect if the current tab is idle or not and close/open the active item respectively. 
    */
    console.log("IDLE INSIDE")
    $(window).idle(
        function() {
           sendMessage('closeItem'); //on idle 
        },
        function() {

            sendMessage('openItem'); //on active
        },  
        {
            'after': 50000, //5 min max idle
    });
});