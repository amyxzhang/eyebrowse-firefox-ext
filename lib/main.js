///////////Global vars/////////////
var widgets = require("widget");
var tabs = require("tabs");
var data = require("self").data;

var baseUrl = "http://localhost:5000"; 
// global website base, set to localhost for testing
//var baseUrl = "http://eyebrowse.herokuapp.com"
var siteName = "Eyebrowse";

function iconUrl() {
    return baseUrl + "/static/common/img/logo.png"
}

/*
    Create widget for add-on and panel to display login UI to
*/
function getWidget() {
    var panel = require("panel").Panel({
        width: 340,
        height: 275,
        contentURL: data.url("popup.html"),
        contentScriptFile: [
            data.url("libs/jquery-1.8.2.js"),
            data.url("libs/underscore.js"),
            data.url("libs/backbone.js"),
            data.url("libs/bootstrap.js"),
            data.url("libs/sprintf-0.7-beta1.js"),
            data.url('js/popup.js'),
        ], 
    });

    var widget = widgets.Widget({
        id: "mozilla-link",
        label: "Eyebrowse by CSAIL",
        contentURL: iconUrl(),
        panel: panel,
    });

    // When the panel is displayed it generated an event called
    // "show": we will listen for that event and when it happens,
    // send our own "show" event to the panel's script, so the
    // script can prepare the panel for display.
    panel.on("show", function() {
        panel.port.emit("show", {
            'baseUrl' : baseUrl,
        });
    });
     
    // Listen for messages called "text-entered" coming from
    // the content script. The message payload is the text the user
    // entered.
    // In this implementation we'll just log the text to the console.
    panel.port.on("text-entered", function (text) {
        console.log(text);
        panel.hide();
    });
}

function main() {
    getWidget();
}

main()