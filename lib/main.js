//Copy of the sprintf function which is used throughout since require doesn't work.
var sprintf = (function() {
    function get_type(variable) {
        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
    }
    function str_repeat(input, multiplier) {
        for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
        return output.join('');
    }

    var str_format = function() {
        if (!str_format.cache.hasOwnProperty(arguments[0])) {
            str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
        }
        return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
    };

    str_format.format = function(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
        for (i = 0; i < tree_length; i++) {
            node_type = get_type(parse_tree[i]);
            if (node_type === 'string') {
                output.push(parse_tree[i]);
            }
            else if (node_type === 'array') {
                match = parse_tree[i]; // convenience purposes only
                if (match[2]) { // keyword argument
                    arg = argv[cursor];
                    for (k = 0; k < match[2].length; k++) {
                        if (!arg.hasOwnProperty(match[2][k])) {
                            throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
                        }
                        arg = arg[match[2][k]];
                    }
                }
                else if (match[1]) { // positional argument (explicit)
                    arg = argv[match[1]];
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++];
                }

                if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
                    throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
                }
                switch (match[8]) {
                    case 'b': arg = arg.toString(2); break;
                    case 'c': arg = String.fromCharCode(arg); break;
                    case 'd': arg = parseInt(arg, 10); break;
                    case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
                    case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
                    case 'o': arg = arg.toString(8); break;
                    case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
                    case 'u': arg = Math.abs(arg); break;
                    case 'x': arg = arg.toString(16); break;
                    case 'X': arg = arg.toString(16).toUpperCase(); break;
                }
                arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
                pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
                pad_length = match[6] - String(arg).length;
                pad = match[6] ? str_repeat(pad_character, pad_length) : '';
                output.push(match[5] ? arg + pad : pad + arg);
            }
        }
        return output.join('');
    };

    str_format.cache = {};

    str_format.parse = function(fmt) {
        var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
        while (_fmt) {
            if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
                parse_tree.push(match[0]);
            }
            else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
                parse_tree.push('%');
            }
            else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1;
                    var field_list = [], replacement_field = match[2], field_match = [];
                    if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1]);
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                            }
                            else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                            }
                            else {
                                throw('[sprintf] huh?');
                            }
                        }
                    }
                    else {
                        throw('[sprintf] huh?');
                    }
                    match[2] = field_list;
                }
                else {
                    arg_names |= 2;
                }
                if (arg_names === 3) {
                    throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
                }
                parse_tree.push(match);
            }
            else {
                throw('[sprintf] huh?');
            }
            _fmt = _fmt.substring(match[0].length);
        }
        return parse_tree;
    };

    return str_format;
})();

var vsprintf = function(fmt, argv) {
    argv.unshift(fmt);
    return sprintf.apply(null, argv);
};

///////////Global vars/////////////

///////////Firefox Vars/////////////
var widgets = require("widget");
var tabs = require("tabs");
var data = require("self").data;
var Request = require('request').Request;
var localStorage = require("sdk/simple-storage");

var baseUrl = "http://localhost:5000";
var proxyUrl = "http://localhost:8080";
// global website base, set to localhost for testing
//var baseUrl = "http://eyebrowse.herokuapp.com"
var siteName = "Eyebrowse";

///////////Library Vars/////////////
var moment = require("./moment.min");
var _ = require('./underscore');
var Backbone = require('./backbone');
// Firefox Add-Ons cannot use jQuery in the background
// script, but there are instances where we need some 
// jquery functionality, paricularly $.ajax, which
// is defined later.
$ = {
    ajax: function (params) {
        if (!params.url){
            console.error('ajax request made without url');
            return false;
        }

        var util = this;

        params.onComplete = function (response) {
            // WARNING: response is read-only. 
            if (response.status === 200){
                params.success &&
                params.success(response.text, response.status, response);   
            }else{
                console.error('ajax request failed');
                params.error &&
                params.error({
                    responseText: response.text,
                    status: response.status 
                });
            }
        };
        Request(params).get();
    }           
};

// use our pseudo-jQuery instead 
Backbone.setDomLibrary($);

///////////Models//////////////

//This object can represent either a whitelist or blacklist for a given user. On an update send results to server to update stored data. On intialization set is synced with server. Should allow offline syncing in the future.
var FilterListItem = Backbone.Model.extend({
    parse: function(data) {
        if (data != null) {
            return {
                url : data.url, 
                id : data.id,
            }
        }
    },
});


var FilterList = Backbone.Collection.extend({

    model: FilterListItem,

    initialize: function(type) {
        _.bindAll(this);
        this.type = type;
        // this.fetch()
    },
    getType : function() {
        return this.get('type')
    },
    url : function() {
        return getApiURL(this.type)
    },
    parse: function(data, res){
        if (res.status === 200) {
            return data.objects;    
        }
        user.logout() //triggers logout badge update
    },
});


//User object holds the status of the user, the cookie from the server, preferences for eyebrowse, whitelist, blacklist, etc
var User = Backbone.Model.extend({
    defaults: {
        'loggedIn' : false,
        'whitelist' : new FilterList('whitelist'),
        'blacklist' : new FilterList('blacklist'),
        'username' : '',
        'resourceURI' : '/api/v1/user/',
    },

    initialize : function() {
        _.bindAll(this); //allow access to 'this' in callbacks with 'this' meaning the object not the context of the callback

    },

    getWhitelist : function() {
        return this.get('whitelist')
    },

    getBlacklist : function() {
        return this.get('blacklist')
    },

    getUsername : function() {
        return this.get('username')
    },

    getResourceURI : function() {
        return this.get('resourceURI')
    },

    isLoggedIn : function() {
        if (this.getUsername() === this.defaults.username || this.getResourceURI() === this.defaults.resourceURI) {
            this.logout();
        }
        return this.get('loggedIn')
    },

    //when the user is logged in set the boolean to give logged in views.
    setLogin : function(status) {
        this.set({ 
            'loggedIn': status,
        });

        var map = {
            'true' : 'login',
            'false' : 'logout'
        };

        // loginBadge(map[status]);
    },

    login : function() {
        this.setLogin(true);
    },

    logout : function() {
        this.setLogin(false);
    },
    
    setUsername : function(username) {
        this.set({ 
            'username': username,
        });
        this.setResourceURI(username);
    },

    setResourceURI : function(username) {
        this.set({
            'resourceURI' : sprintf('/api/v1/user/%s/', username)
        })
    },

    setWhitelist : function(whitelist) {
        this.setFilterSet('whitelist', whitelist);
    },

    setBlacklist : function(blacklist) {
        this.setFilterSet('blacklist', blacklist);
    },

    setFilterSet : function(type, list) {
        this.set({
            type : list
        })
    },

    //check if a url is in the blacklist
    inBlackList : function(url) {
        return this.inSet('blacklist', url)
    },

    //check if a url is in the whitelise
    inWhitelist : function(url) {
        return this.inSet('whitelist', url)
    },

    //check if url is in a set (either whitelist or blacklist)
    // documentation for URL.js : http://medialize.github.com/URI.js/docs.html
    inSet : function(setType, url) {
        var set = this.get(setType);
        var uri = new URI(url)
        var hostname = uri.hostname();
        var protocol = uri.protocol();
        return (set.where({'url' : hostname}).length || set.where({"url" : protocol}).length || set.where(url).length)
    },

    //save the current state to local storage
    saveState : function(){
        localStorage.user = JSON.stringify(this);
    }
});


// /*
//     inputs:
//     tabId - indentifer of tab (unique to session only)
//     url - url of the tab making the request
//     favIconUrl - used for displaying content
//     title - title of the webpage the tab is displaying
//     event_type - whether a tab is opening or closing/navigating to a new page etc
// */
// function openItem(tabId, url, favIconUrl, title, event_type) {
//     var timeCheck = checkTimeDelta();
//     var uri = new URI(url);
//     //if its not in the whitelist lets check that the user has it
//     if (!user.inWhitelist(url) && !user.inBlackList(url)) {

//         timeCheck.allow = false; // we need to wait for prompt callback
//         chrome.tabs.sendMessage(tabId, {"action": "prompt"},function(res){
//                 if (res != undefined && res.prompRes == 'allow') {
//                     finishOpen(tabId, url, favIconUrl, title, event_type);
//                 }
//             });

//     } else if (user.inBlackList(url)) {
//         return
//     } 

//     if (timeCheck.allow){
//         finishOpen(tabId, url, favIconUrl, title, event_type, timeCheck.time);
//     }
// }

// function finishOpen(tabId, url, favIconUrl, title, event_type, time) {
    
//     if (activeItem != undefined) {
//         closeItem(activeItem.tabId, activeItem.url, 'blur', time);
//     };
        
//     //reassign the active item to be the current tab
//     activeItem = {
//         'tabId' : tabId,
//         'url' : url,
//         'favIconUrl' : favIconUrl,
//         'title' : title,
//         'start_event' : event_type,
//         'start_time' : new Date(),
//     };
// }

// /* 
//     There is only ever one activeItem at a time so only close out the active one. 
//     This event will be fired when a tab is closed or unfocused but we would have already 'closed' the item so we don't want to do it again.
// */
// function closeItem(tabId, url, event_type, time, callback) {
//     if (activeItem === undefined) return;
//     var time = time || new Date(); // time is undefined for destroy event
//     var callback = callback || false;
//     if (activeItem.tabId === tabId && !user.inBlackList(url)) {
//         //write to local storage
//         var item = $.extend({}, activeItem); //copy activeItem

//         item.end_event = event_type;
//         item.end_time = time;
//         item.total_time = item.end_time - item.start_time;
//         item.humanize_time = moment.humanizeDuration(item.total_time);
//         local_history.push(item);

//         // send data for server and sync whitelist/blacklist
//         if (local_history.length) {
//             dumpData();
//             user.getWhitelist().fetch();
//             user.getBlacklist().fetch();   
//         }
//     }
//     if (callback) {
//         callback();
//     }
// }

// function executeMessage(request, sender, sendResponse) {
//     var message = JSON.parse(request);
//     var action = message.action;
//     if (action == "filterlist") {
//         handleFilterListMsg(message);
//     } else if (action == "idle") {
//        handleIdleMsg(message, sender.tab.id);
//     } else {
//         console.log("Action not supported");
//     }
// }

// function handleFilterListMsg(message) {
//     var type = message.type;
//     var url = message.url;
//     var list;
//     if (type == 'whitelist') {
//         list = user.getWhitelist();
//     } else if (type == 'blacklist') {
//         list = user.getBlacklist();
//     } else {
//         return
//     }
//     m = list.create({
//         'url' : url,
//         'user' : user.getResourceURI(),
//     });

//     localStorage['user'] = JSON.stringify(user);
// }

// function handleIdleMsg(message, tabId) { 
//     var type = message.type;
//     if (type == 'openItem')  {
//         openTab(tabId, 'focus');
//     } else if (type == 'closeItem' && activeItem != undefined) { 
//         closeTab(tabId, 'idle', function() {
//                 activeItem = undefined;
//             });
//     }
// }

// /*
//     Posts data to server
// */
// function dumpData() {
//     var backlog = []
//     var url = getApiURL('history-data');
//     $.each(local_history, function(index, item){
//         payload = serializePayload(item);
//         $.ajax({
//             type: 'POST',
//             url: url,
//             data: payload,
//             dataType: "text",
//             processData:  false,
//             contentType: "application/json",
//             error: function(jqXHR, textStatus, errorThrown){
//                 // log the error to the console
//                 console.log(
//                     "The following error occured: "+
//                     textStatus, errorThrown
//                 );
//                 backlog.push(item);
//                 if (index == local_history.length-1) {
//                     local_history = backlog;
//                 }
//             },
//             success: function(data, textStatus, jqXHR) {
//                if (index == local_history.length-1) {
//                     local_history = [];
//                 } 
//             },
//         });
//     });
// }

// /*
//     checks if the time between the current event and the active item is greater than the delta. Default delta is 900ms
// */
// function checkTimeDelta(delta) {
//     var delta = delta || 900
//     var now = new Date();
//     var allow = true; // default to true allows active item to be set initially
//     if (activeItem != undefined) { 
//         allow = (now.getTime() - activeItem.start_time) > delta
//     }

//     return {
//         'allow' : allow,
//         'time' : now,
//     }
// }

function getApiURL(resource, id, params) {
    params = params || {};
    var apiBase = sprintf('%s/api/v1/%s', baseUrl, resource);
    var getParams = ''
    for (var key in params) {
      getParams += sprintf("&%s=%s", key, params[key]);
    }
    if (id != null) {
        apiBase += '/' + id;
    } 
    return apiBase
}

/////////init models///////
function loadLocalHistory() {
    localString = localStorage['local_history'];
    localString = (localString) ? localString : "[]"; // catch undefined case
    return JSON.parse(localString);
}

/*
    Get and return the user from local storage.
    If no user is found create a new one.
    If an old user exists unJSON the object and return it.
*/
function getLocalStorageUser() {
    storedUser = localStorage.user;
    if (storedUser === "null" || storedUser === undefined) {
        user = new User();
        return user
    }
    o = JSON.parse(storedUser);
    var u = new User();

    u.setUsername(o.username);
    u.setLogin(o.loggedIn);
    u.setBlacklist(o.blacklist);
    u.setWhitelist(o.whitelist);

    return u
}

/*
    Clear the local storage for the given key
*/ 
function clearLocalStorage(key) {
    localStorage[key] = null;
}

//  Check if these are already set to avoid overwriting.
function localSetIfNull(key, value) {
    if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, value);
    }
}

//converts the data to JSON serialized
function serializePayload(payload) {
    payload.start_time = payload.start_time
    payload.end_time = payload.end_time
    payload.user = user.getResourceURI();
    return JSON.stringify(payload);
}


/*
    Create widget for add-on and panel to display login UI to
*/
function setPanel() {
    var panel = require("panel").Panel({
        width: 340,
        height: 300,
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
        contentURL: baseUrl + "/static/common/img/logo.png",
        panel: panel,
    });

    return panel
}

///////////PANEL LISTENERS ////////////////////
function setPanelListeners(panel){
    // When the panel is displayed it generated an event called
    // "show": we will listen for that event and when it happens,
    // send our own "show" event to the panel's script, so the
    // script can prepare the panel for display.
    panel.on("show", function() {;
        panel.port.emit("show", {
            'baseUrl' : baseUrl,
            'loggedIn' : user.isLoggedIn(),
            'proxyUrl' : proxyUrl,
        });
    });
}

function main() {
    var panel = setPanel();
    setPanelListeners(panel)
    // dictionary mapping all open items. Keyed on tabIds and containing all information to be written to the log. 
    // var activeItem;

    local_history = loadLocalHistory();

    user = getLocalStorageUser();
    // initBadge()

    // localSetIfNull("baseUrl", baseUrl);
}

main()