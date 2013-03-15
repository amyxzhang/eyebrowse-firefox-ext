function sendMessage(action) {
    var msg = {
            'type': action,
    };
    self.port.emit("idleRes", JSON.stringify(msg));
}


self.port.on("idle", function(data) {
    /*
        https://github.com/jasonmcleod/jquery.idle
        Detect if the current tab is idle or not and close/open the active item respectively. 
    */
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