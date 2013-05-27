/*!
 * URL.js
 *
 * Copyright 2011 Eric Ferraiuolo
 * https://github.com/ericf/urljs
 */
var URL=function(){var u=this;if(!(u&&u.hasOwnProperty&&(u instanceof URL))){u=new URL()}return u._init.apply(u,arguments)};(function(){var ABSOLUTE="absolute",RELATIVE="relative",HTTP="http",HTTPS="https",COLON=":",SLASH_SLASH="//",AT="@",DOT=".",SLASH="/",DOT_DOT="..",DOT_DOT_SLASH="../",QUESTION="?",EQUALS="=",AMP="&",HASH="#",EMPTY_STRING="",TYPE="type",SCHEME="scheme",USER_INFO="userInfo",HOST="host",PORT="port",PATH="path",QUERY="query",FRAGMENT="fragment",URL_TYPE_REGEX=/^(?:(https?:\/\/|\/\/)|(\/|\?|#)|[^;:@=\.\s])/i,URL_ABSOLUTE_REGEX=/^(?:(https?):\/\/|\/\/)(?:([^:@\s]+:?[^:@\s]+?)@)?((?:[^;:@=\/\?\.\s]+\.)+[A-Za-z0-9\-]{2,})(?::(\d+))?(?=\/|\?|#|$)([^\?#]+)?(?:\?([^#]+))?(?:#(.+))?/i,URL_RELATIVE_REGEX=/^([^\?#]+)?(?:\?([^#]+))?(?:#(.+))?/i,OBJECT="object",STRING="string",TRIM_REGEX=/^\s+|\s+$/g,trim,isObject,isString;trim=String.prototype.trim?function(s){return(s&&s.trim?s.trim():s)}:function(s){try{return s.replace(TRIM_REGEX,EMPTY_STRING)}catch(e){return s}};isObject=function(o){return(o&&typeof o===OBJECT)};isString=function(o){return typeof o===STRING};URL.ABSOLUTE=ABSOLUTE;URL.RELATIVE=RELATIVE;URL.normalize=function(url){return new URL(url).toString()};URL.resolve=function(baseUrl,url){return new URL(baseUrl).resolve(url).toString()};URL.prototype={_init:function(url){this.constructor=URL;url=isString(url)?url:url instanceof URL?url.toString():null;this._original=url;this._url={};this._isValid=this._parse(url);return this},toString:function(){var url=this._url,urlParts=[],type=url[TYPE],scheme=url[SCHEME],path=url[PATH],query=url[QUERY],fragment=url[FRAGMENT];if(type===ABSOLUTE){urlParts.push(scheme?(scheme+COLON+SLASH_SLASH):SLASH_SLASH,this.authority());if(path&&path.indexOf(SLASH)!==0){path=SLASH+path}}urlParts.push(path,query?(QUESTION+this.queryString()):EMPTY_STRING,fragment?(HASH+fragment):EMPTY_STRING);return urlParts.join(EMPTY_STRING)},original:function(){return this._original},isValid:function(){return this._isValid},isAbsolute:function(){return this._url[TYPE]===ABSOLUTE},isRelative:function(){return this._url[TYPE]===RELATIVE},isHostRelative:function(){var path=this._url[PATH];return(this.isRelative()&&path&&path.indexOf(SLASH)===0)},type:function(){return this._url[TYPE]},scheme:function(scheme){return(arguments.length?this._set(SCHEME,scheme):this._url[SCHEME])},userInfo:function(userInfo){return(arguments.length?this._set(USER_INFO,userInfo):this._url[USER_INFO])},host:function(host){return(arguments.length?this._set(HOST,host):this._url[HOST])},domain:function(){var host=this._url[HOST];return(host?host.split(DOT).slice(-2).join(DOT):undefined)},port:function(port){return(arguments.length?this._set(PORT,port):this._url[PORT])},authority:function(){var url=this._url,userInfo=url[USER_INFO],host=url[HOST],port=url[PORT];return[userInfo?(userInfo+AT):EMPTY_STRING,host,port?(COLON+port):EMPTY_STRING,].join(EMPTY_STRING)},path:function(path){return(arguments.length?this._set(PATH,path):this._url[PATH])},query:function(query){return(arguments.length?this._set(QUERY,query):this._url[QUERY])},queryString:function(queryString){if(arguments.length){return this._set(QUERY,this._parseQuery(queryString))}queryString=EMPTY_STRING;var query=this._url[QUERY],i,len;if(query){for(i=0,len=query.length;i<len;i++){queryString+=query[i].join(EQUALS);if(i<len-1){queryString+=AMP}}}return queryString},fragment:function(fragment){return(arguments.length?this._set(FRAGMENT,fragment):this._url[FRAGMENT])},resolve:function(url){url=(url instanceof URL)?url:new URL(url);var resolved,path;if(!(this.isValid()&&url.isValid())){return this}if(url.isAbsolute()){return(this.isAbsolute()?url.scheme()?url:new URL(url).scheme(this.scheme()):url)}resolved=new URL(this.isAbsolute()?this:null);if(url.path()){if(url.isHostRelative()||!this.path()){path=url.path()}else{path=this.path().substring(0,this.path().lastIndexOf(SLASH)+1)+url.path()}resolved.path(this._normalizePath(path)).query(url.query()).fragment(url.fragment())}else{if(url.query()){resolved.query(url.query()).fragment(url.fragment())}else{if(url.fragment()){resolved.fragment(url.fragment())}}}return resolved},reduce:function(url){url=(url instanceof URL)?url:new URL(url);var reduced=this.resolve(url);if(this.isAbsolute()&&reduced.isAbsolute()){if(reduced.scheme()===this.scheme()&&reduced.authority()===this.authority()){reduced.scheme(null).userInfo(null).host(null).port(null)}}return reduced},_parse:function(url,type){url=trim(url);if(!(isString(url)&&url.length>0)){return false}var urlParts,parsed;if(!type){type=url.match(URL_TYPE_REGEX);type=type?type[1]?ABSOLUTE:type[2]?RELATIVE:null:null}switch(type){case ABSOLUTE:urlParts=url.match(URL_ABSOLUTE_REGEX);if(urlParts){parsed={};parsed[TYPE]=ABSOLUTE;parsed[SCHEME]=urlParts[1]?urlParts[1].toLowerCase():undefined;parsed[USER_INFO]=urlParts[2];parsed[HOST]=urlParts[3].toLowerCase();parsed[PORT]=urlParts[4]?parseInt(urlParts[4],10):undefined;parsed[PATH]=urlParts[5]||SLASH;parsed[QUERY]=this._parseQuery(urlParts[6]);parsed[FRAGMENT]=urlParts[7]}break;case RELATIVE:urlParts=url.match(URL_RELATIVE_REGEX);if(urlParts){parsed={};parsed[TYPE]=RELATIVE;parsed[PATH]=urlParts[1];parsed[QUERY]=this._parseQuery(urlParts[2]);parsed[FRAGMENT]=urlParts[3]}break;default:return(this._parse(url,ABSOLUTE)||this._parse(url,RELATIVE));break}if(parsed){this._url=parsed;return true}else{return false}},_parseQuery:function(queryString){if(!isString(queryString)){return}queryString=trim(queryString);var query=[],queryParts=queryString.split(AMP),queryPart,i,len;for(i=0,len=queryParts.length;i<len;i++){if(queryParts[i]){queryPart=queryParts[i].split(EQUALS);query.push(queryPart[1]?queryPart:[queryPart[0]])}}return query},_set:function(urlPart,val){this._url[urlPart]=val;if(val&&(urlPart===SCHEME||urlPart===USER_INFO||urlPart===HOST||urlPart===PORT)){this._url[TYPE]=ABSOLUTE}if(!val&&urlPart===HOST){this._url[TYPE]=RELATIVE}this._isValid=this._parse(this.toString());return this},_normalizePath:function(path){var pathParts,pathPart,pathStack,normalizedPath,i,len;if(path.indexOf(DOT_DOT_SLASH)>-1){pathParts=path.split(SLASH);pathStack=[];for(i=0,len=pathParts.length;i<len;i++){pathPart=pathParts[i];if(pathPart===DOT_DOT){pathStack.pop()}else{if(pathPart){pathStack.push(pathPart)}}}normalizedPath=pathStack.join(SLASH);if(path[0]===SLASH){normalizedPath=SLASH+normalizedPath}if(path[path.length-1]===SLASH&&normalizedPath.length>1){normalizedPath+=SLASH}}else{normalizedPath=path}return normalizedPath}}}());

/////////////////START REAL CODE////////////

////////send requests to proxy server ///////
function proxy_url() {
    return proxyUrl
}

function addProxyParam(url, cookies, headers){
    params = ""
    for (var key in cookies){
        params += print.sprintf("&%s=%s", key, cookies[key])
    }
    return proxy_url() + "?proxy_url=" + url  + params
}

function ajaxWrapper(params){
    var args = user.getAllCookies();
    params.url = addProxyParam(params.url, args);
    try {
        params.content = JSON.parse(params.data)   
    }
    catch(err){
        console.log(err)
    }

    delete params.data;
    delete params.contentType;
    return params
}

// Firefox Add-Ons cannot use jQuery in the background
// script, but there are instances where we need some 
// jquery functionality, paricularly $.ajax, which
// is defined later.
$ = {
    ajax: function (params) {
        params = ajaxWrapper(params)
        if (!params.url){
            console.error('ajax request made without url');
            return false;
        }

        params.onComplete = function (response) {
            // WARNING: response is read-only.
            if (response.status === 200){
                params.success &&
                params.success(response.text, response.status, response);   
            } else {
                console.error('ajax request failed');
                params.error &&
                params.error({
                    responseText: response.text,
                    status: response.status 
                });
                if (navigator.onLine){
                    user.logout(); //notify user of server error
                }
            }
        };

        var req = Request(params)[requestMap[params.type]]();
    }           
};

///////////Global vars/////////////
// var baseUrl = "http://localhost:5000";
// var proxyUrl = "http://localhost:5000";
// global website base, set to localhost for testing
var baseUrl = "http://eyebrowse.csail.mit.edu"
var proxyUrl = "http://eyebrowse.csail.mit.edu"
var activeItem;
var requestMap = {
    'GET' : 'get',
    'POST' : 'post',
    'PUT' : 'put',
}

///////////Firefox Vars/////////////
var widgets = require("widget");
var data = require("self").data;
var Request = require('request').Request;
var localStorage = require("sdk/simple-storage");
var tabs = require('sdk/tabs');
var windows = require("sdk/windows").browserWindows;
var pageMod = require("sdk/page-mod");

///////////Library Vars/////////////
var moment = require("./moment.min");
var _ = require('./underscore');
var Backbone = require('./backbone');
var print = require('./sprintf-0.7-beta1');
// var URL = require('./url-min');

// use our pseudo-jQuery instead 
Backbone.setDomLibrary($);


//Interesting events:
//When an active tab is selected
//When a new page is navigated to (must filter for bad urls)
//When a new window is opened/selected (same as tab event)
//When a tab or window is destroyed

///////////////Event listeners/////////////// 
//Each function calls the data processor function in main.js to be processed and recorded if necessary. The handler checks for things like restricted sites and user permissions that are set.

//We need to listen for both (so we know when new tabs/windows appear). But no double counting.
function activeTabListener() {
    tabs.on('activate', function(tab) {
        var event_type = 'focus';
        openItem(tab.url, tab.favicon, tab.title, event_type);
    });
}

/*
    Fired when a tab is updated.
*/
function updatedTabListener() {
   tabs.on('ready', function(tab) {
        var event_type = 'update';
        openItem(tab.url, tab.favicon, tab.title, event_type);
    }); 
}


/*
    Fired when a tab is closed. 
*/
function removedTabListener() {
    tabs.on('close', function(tab) {
        var event_type = 'destroy';
        closeItem(tab.url, event_type, false);
    });
}

/*
    Fired when a tab is closed. 
*/
function removedTabListener() {
    tabs.on('deactivate', function(tab) {
        var event_type = 'blur';
        closeItem(tab.url, event_type, false);
    });
}

/*
    Fired when the window is closed. Writes all data to localStorage
*/
function closedWindowListener() {
   windows.on('close', function() {
        localStorage.local_history = JSON.stringify(local_history);
        localStorage.user = JSON.stringify(user);
    });
}

/*
Helper to open urls from the extension to the main website
*/
function openLink(data) {
    tabs.open({'url': data.url});
}

function clearStorage(){
    localStorage.removeItem('local_history')
    local_history = []
}

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
        return getApiURL(this.type, null, {'format' : 'json'})
    },

    parse: function(data, res){
        if (res.status === 200) {
            return JSON.parse(data).objects;    
        }
    },
});


//User object holds the status of the user, the cookie from the server, preferences for eyebrowse, whitelist, blacklist, etc
var User = Backbone.Model.extend({
    defaults: {
        'loggedIn' : false,
        'whitelist' : new FilterList('whitelist'),
        'blacklist' : new FilterList('blacklist'),
        'nags' : {"visits":11,"factor":1,"lastNag":(new Date()).getTime()-24*360000},
        'username' : '',
        'resourceURI' : '/api/v1/user/',
        'cookies' : {},
        'csrftoken' : '',
        'sessionid' : '',
        "ignoreLoginPrompt" : true,
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

    getNags : function() {
        return this.get("nags")
    },

    getUsername : function() {
        return this.get('username')
    },

    getResourceURI : function() {
        return this.get('resourceURI')
    },

    getAllCookies : function() {
        return this.get('cookies')
    },

    getCookie : function(key) {
        return this.get('cookies')[key]
    },

    isLoggedIn : function() {
        if (this.getUsername() === this.defaults.username || this.getResourceURI() === this.defaults.resourceURI) {
            this.logout();
        }
        return this.get('loggedIn')
    },

    ignoreLoginPrompt : function(){
        return this.get("ignoreLoginPrompt");
    },

    //when the user is logged in set the boolean to give logged in views.
    setLogin : function(status) {
        this.set({ 
            'loggedIn': status,
        });
    },

    login : function() {
        this.setLogin(true);
        this.setLoginPrompt(false);
    },

    logout : function() {
        this.setLogin(false);
        clearLocalStorage('user')
    },
    
    setUsername : function(username) {
        this.set({ 
            'username': username,
        });
        this.setResourceURI(username);
    },

    setCookie : function(key, value) {
        var cookies = this.get('cookies');
        cookies[key] = value;
        this.set({ 
            'cookies': cookies,
        });
        var whitelist = this.getWhitelist();
        whitelist.url = function() {
            params = cookies
            params['format'] = 'json'
            return getApiURL(this.type, null, params)
        };

        var blacklist = this.getBlacklist();
        blacklist.url = function() {
            params = cookies
            params['format'] = 'json'
            return getApiURL(this.type, null, params)
        };
    },

    clearCookies : function() {
        this.set({
            'cookies' : {},
        })
    },

    setResourceURI : function(username) {
        this.set({
            'resourceURI' : print.sprintf('/api/v1/user/%s/', username)
        });
    },

    setWhitelist : function(whitelist) {
        this.setFilterSet('whitelist', whitelist);
    },

    setBlacklist : function(blacklist) {
        this.setFilterSet('blacklist', blacklist);
    },

    setFilterSet : function(type, list) {
        this.set({
            type : list,
        });
    },

    setLoginPrompt : function(bool){
        this.set({
            "ignoreLoginPrompt" : bool
        });
    },

    //check if a url is in the blacklist
    inBlackList : function(url) {
        return this.inSet('blacklist', url)
    },

    //check if a url is in the whitelise
    inWhitelist : function(url) {
        return this.inSet('whitelist', url)
    },

    //sets exponential backoff factor
    setNagFactor : function(url,rate) {
        if (url != "") {
            var nags = this.getNags()
            var site = nags[url]
            var visits = site["visits"]
            var lastNag = site["lastNag"]
            var factor = site["factor"]

            var newSite = {"visits":visits,"lastNag":lastNag,"factor":Math.max(Math.min(factor*rate,16),1)}
            nags[url] = newSite

            this.set({ 
                "nags": nags,
            });
        }
    },

    //check if a url should be nagged
    shouldNag : function(url) {
        var timeThres = 3600000 //1 hour in milliseconds
        var visitThres = 5

        var overallThres = 10

        var nags = this.getNags()

        var overallVisits = nags["visits"]
        var overallLastNag = nags["lastNag"]

        var b_Nag = false
        var now = (new Date()).getTime()
        if (overallVisits >= overallThres || now - overallLastNag > timeThres) {
            var newSite = undefined
            if (url in nags) {
                var site = nags[url]
                var visits = site["visits"]
                var lastNag = site["lastNag"]
                var factor = site["factor"]

                if (visits >= visitThres*factor || now - lastNag > timeThres*factor) {
                    b_Nag = true
                    newSite = {"visits":0,"lastNag":now,"factor":factor}
                    nags["visits"] = 0
                    nags["lastNag"] = now
                } else {
                    newSite = {"visits":visits+1,"lastNag":lastNag,"factor":factor}
                    nags["visits"]++
                }
            } else {
                b_Nag = true
                newSite = {"visits":1,"lastNag":now,"factor":1}
                nags["lastNag"] = now
                nags["visits"] = 0
            }
            nags[url] = newSite
        } else {
            nags["visits"]++
            var newSite = undefined
            if (url in nags) {
                var site = nags[url]
                var visits = site["visits"]
                var lastNag = site["lastNag"]
                var factor = site["factor"]

                newSite = {"visits":visits+1,"lastNag":lastNag,"factor":factor}
            } else {
                newSite = {"visits":1,"lastNag":now-24*timeThres,"factor":1}
            }
            nags[url] = newSite
        }
        this.set({ 
            "nags": nags,
        });

        return b_Nag
    },

    //check if url is in a set (either whitelist or blacklist)
    // documentation for URL.js : http://medialize.github.com/URI.js/docs.html
    inSet : function(setType, url) {
        var set = this.get(setType);
        var url = URL(url)
        var host = url.host();
        var scheme = url.scheme();
        return (set.where({'url' : host}).length || set.where({"url" : scheme}).length || set.where({"url" : url}).length)
    },

    completeLogin : function() {
        this.getBlacklist().fetch({
            success: function (data) {
                user.saveState();
            }
        });
        this.getWhitelist().fetch({
            success: function (data) {
                user.saveState();
            }
        });

    },

    //save the current state to local storage
    saveState : function(){
        localStorage.user = JSON.stringify(this);
    },
});


/*
    inputs:
    url - url of the tab making the request
    favIconUrl - used for displaying content
    title - title of the webpage the tab is displaying
    event_type - whether a tab is opening or closing/navigating to a new page etc
*/
function openItem(url, favIconUrl, title, event_type) {
    widget.contentURL = getWidgetUrl(false)
    if (!user.isLoggedIn()){
        if (!user.ignoreLoginPrompt()){
            setPromptMod({
                "action" : "prompt",
                "type" : "loginPrompt",
                "url" : url,
            });
        }
      return
    }
    setIdleMod(url)
    var timeCheck = checkTimeDelta();
    user.getWhitelist().fetch();
    user.getBlacklist().fetch();
    //if its not in the whitelist lets check that the user has it
    if (!user.inWhitelist(url) && !user.inBlackList(url) && user.shouldNag(URL(url).host())) {

        timeCheck.allow = false; // we need to wait for prompt callback
        setPromptMod({
            "url" : url,
            "favIconUrl" : favIconUrl,
            "title" : title,
            "event_type" : event_type,
            "type" : "trackPrompt", 
            "action": "prompt",
        });

    } else if (user.inBlackList(url)) {
        return
    } 

    if (user.inWhitelist(url) && timeCheck.allow){
        widget.contentURL = getWidgetUrl(true)
        finishOpen(url, favIconUrl, title, event_type, timeCheck.time);
    }
}

function finishOpen(url, favIconUrl, title, event_type, time) {
    if (activeItem !== undefined) {
        closeItem(activeItem.url, 'blur', time);
    };
        
    //reassign the active item to be the current tab
    activeItem = {
        'url' : url,
        'favIconUrl' : favIconUrl,
        'title' : title,
        'start_event' : event_type,
        'start_time' : new Date(),
    };
}

/* 
    There is only ever one activeItem at a time so only close out the active one. 
    This event will be fired when a tab is closed or unfocused but we would have already 'closed' the item so we don't want to do it again.
*/
function closeItem(url, event_type, time) {
    if (activeItem === undefined) return;
    var time = time || new Date(); // time is undefined for destroy event
    if (!user.inBlackList(url)) {
        //write to local storage
        var item = clone(activeItem); //copy activeItem

        item.end_event = event_type;
        item.end_time = time;
        item.total_time = item.end_time - item.start_time;
        item.humanize_time = moment.humanizeDuration(item.total_time);
        local_history.push(item);

        // send data for server and sync whitelist/blacklist
        if (local_history.length) {
            dumpData();
            user.getWhitelist().fetch();
            user.getBlacklist().fetch();
        }
    }
}

/*
    create a whitelist or blacklist item when the message comes in from the prompt
*/
function handleFilterListMsg(type, url) {
    var list;
    user.setNagFactor(URL(url).host(),.5);
    if (type === "whitelist") {
        list = user.getWhitelist();
    } else if (type === "blacklist") {
        list = user.getBlacklist();
    } else {
        return
    }
    m = list.create({
        "url" : url,
        "user" : user.getResourceURI(),
    });
    localStorage.user = JSON.stringify(user);

}

/*
    close an item if the tab is idle
*/
function handleIdleMsg(msg) {
    var msg = JSON.parse(msg);
    var type = msg.type;
    var event_type;
    var tab = tabs.activeTab;
    if (type == 'openItem')  {
        event_type = 'focus';
        openItem(tab.url, tab.favicon, tab.title, event_type);
    } else if (type == 'closeItem' && activeItem !== undefined) { 
        event_type = "idle";
        closeItem(tab.url, event_type, false);
    }
}

/*
    Open the popup so the user can logback in again
*/
function handleLoginMsg(){
   tabs.open('html/popup.html');
}

/*
    Set the nag factor for exponential backoff
*/
function handleNagMsg(url){
   user.setNagFactor(URL(url).host(),2);
}

/*
    Store the ignore state so the popup message does not display
*/
function handleIgnoreMsg(){
    user.setLoginPrompt(true);
}

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

/*
    Posts data to server
*/
function dumpData() {
    var backlog = []
    var url = getApiURL('history-data');
    for(var index in local_history) {
        var item = local_history[index];
        
        payload = serializePayload(item);
        console.log(JSON.stringify(item));
        $.ajax({
            type: 'POST',
            url: url,
            content: payload,
            error: function(jqXHR, textStatus, errorThrown){
                // log the error to the console
                console.log(
                    "The following error occured: "+
                    textStatus, errorThrown
                );
                backlog.push(item);
                if (index == local_history.length-1) {
                    local_history = backlog;
                }
                if (navigator.onLine){
                    user.logout(); //notify user of server error
                }
            },
            success: function(data, textStatus, jqXHR) {
               if (index == local_history.length-1) {
                    local_history = [];
                } 
            },
        });
    }
}

/*
    checks if the time between the current event and the active item is greater than the delta. Default delta is 900ms
*/
function checkTimeDelta(delta) {
    var delta = delta || 900
    var now = new Date();
    var allow = true; // default to true allows active item to be set initially
    if (activeItem != undefined) { 
        allow = (now.getTime() - activeItem.start_time) > delta
    }

    return {
        'allow' : allow,
        'time' : now,
    }
}

function getApiURL(resource, id, params) {
    params = params || {};
    var apiBase = print.sprintf('%s/api/v1/%s', baseUrl, resource);
    var getParams = ''
    for (var key in params) {
      getParams += print.sprintf("&%s=%s", key, params[key]);
    }
    if (getParams !== '') {
        apiBase += "?" + getParams.slice(1);
    }
    if (id != null) {
        apiBase += '/' + id;
    } 
    return apiBase
}

function loadLocalHistory() {
    localString = localStorage.local_history;
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
    if (localStorage[key] === null) {
        localStorage[key] = value;
    }
}
//converts the data to JSON serialized
function serializePayload(payload) {
    payload.start_time = cutStr(JSON.stringify(payload.start_time));
    payload.end_time = cutStr(JSON.stringify(payload.end_time));
    payload.user = user.getResourceURI();
    payload.src = "firefox";
    return payload
}

/*
    slice the last two characters of a string
*/
function cutStr(string) {
    return string.slice(1, string.length-1)
}

function getWidgetUrl(track){
    var mod = ""
    if (track){
        mod = "track-"
    }

    return baseUrl + "/static/extension/img/" + mod + "logo.png"
}


/*
    Create widget for add-on and panel to display login UI to
*/
function setPanel() {
    var panel = require("panel").Panel({
        width: 340,
        height: 300,
        contentURL: data.url("html/popup.html"),
        contentScriptFile: [
            data.url("libs/jquery-1.8.2.js"),
            data.url("libs/underscore.js"),
            data.url("libs/backbone.js"),
            data.url("libs/bootstrap-button.js"),
            data.url("libs/sprintf-0.7-beta1.js"),
            data.url("js/ajaxWrap.js"),
            data.url('js/popup.js'),
        ], 
    });

    var widget = widgets.Widget({
        id: "mozilla-link",
        label: "Eyebrowse by CSAIL",
        contentURL: getWidgetUrl(false),
        panel: panel,
    });

    return {
        "panel" : panel,
        "widget" : widget,
    }
}

/* 
    Create a page mod
    It will run a script on all URLs
    The script inserts the whitelist prompt.
*/
function setPromptMod(args) {
    var m = pageMod.PageMod({
        include: args.url,
        contentScriptFile:[
            data.url("libs/jquery-1.8.2.js"),
            data.url("js/prompt.js"),
        ],
        attachTo: ["top", "existing"],
        onAttach: function(worker) {
            worker.port.emit("prompt", {
                "baseUrl" : baseUrl,
                "type" : args.type,
                "action" : args.action,
            });
            
            worker.port.on("promptRes", function(msg) {
                var msg = JSON.parse(msg)
                var action = msg.action;
                if (action === "filterlist"){
                    handleFilterListMsg(msg.type, msg.url);
                    if (msg.type === 'whitelist') {
                        finishOpen(args.url, args.favIconUrl, args.title, args.event_type);
                    }
                } else if (action == "login"){

                } else if (action == "nag"){
                    user.setNagFactor(URL(msg.url).host(),2);
                }
                m.destroy();
            });
        },
    });
    return m
}

function setIdleMod(url) {
    var m = pageMod.PageMod({
        include: url,
        contentScriptFile:[
            data.url("libs/jquery-1.8.2.js"),
            data.url("libs/jquery.idle.js"),
            data.url("js/idle-detection.js"),
        ],
        attachTo: ["top", "existing"],
        onAttach: function(worker) {
            worker.port.emit("idle");
            worker.port.on("idleRes", function(msg) {
                handleIdleMsg(msg);
                m.destroy();
            });
        },
    });
    return m
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
            'user' : user,
        });
    });

    panel.port.on("userChange", userChange);
    panel.port.on("openLink", openLink);
    

}

////////////USER object handlers////////
/*
    Execute message from add-on script to modify user object
*/
function userChange(data) {
    var func = data.func;
    var args = data.args;
    user[func].apply(undefined, Array.prototype.slice.call(args));
}

function main() {
    // run each listener
    activeTabListener();
    updatedTabListener();
    removedTabListener();
    closedWindowListener();

    var el = setPanel();
    widget = el.widget;
    setPanelListeners(el.panel);
    // dictionary mapping all open items. Keyed on tabIds and containing all information to be written to the log. 

    local_history = loadLocalHistory();
    user = getLocalStorageUser();
    promptMod = null;
    
    // initBadge()

    localSetIfNull("baseUrl", baseUrl);
    localSetIfNull("proxyUrl", proxyUrl);
}

main()