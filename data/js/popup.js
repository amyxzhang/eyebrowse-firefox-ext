LoginView = Backbone.View.extend({
    'el' : $('.content-container'),

    initialize : function() {
        _.bindAll(this);
        this.render();
    },

    render : function() {
        if (!loggedIn) {
            $('.content-container').empty();
            $('body').css('width', '300px');
            var template = _.template($("#login_template").html(), {
                    'baseUrl' : 'baseUrl',
                });

            $(this.el).html(template);
            $('#errors').fadeOut();
            $('#id_username').focus();
        }
    },

    events : {
        "click #login" : "getLogin",
        "keypress input" : "filterKey"
    },

    filterKey : function(e) {
        if (e.which === 13) { // listen for enter event
            e.preventDefault();
            this.getLogin()
        }
    },

    getLogin : function() {
        $('#errors').fadeOut();
        $('#login').button('loading')
        var self = this;
        var username = $('#id_username').val();
        var password = $('#id_password').val();
        if (username === '' || password === '') {
            self.displayErrors("Enter a username and a password")
        } else {
            $.get(url_login(), function(data) {
                self.postLogin(data, username, password);
            });
        }
    },

    postLogin : function(data, username, password) {
        var REGEX = /name\='csrfmiddlewaretoken' value\='.*'/; //regex to find the csrf token
        var match = data.match(REGEX);
        var self = this;
        if (match) {
            match = match[0]
            var csrfmiddlewaretoken = match.slice(match.indexOf("value=") + 7, match.length-1); // grab the csrf token
            //now call the server and login
            ajaxWrapper({
                url: url_login(),
                type: "POST",
                data: {
                        "username": username,
                        "password": password,
                        "csrfmiddlewaretoken" : csrfmiddlewaretoken,
                        "remember_me": 'on', // for convenience
                },
                success: function(data, textStatus, jqXHR) {
                    var match = data.match(REGEX)
                    if(match) { // we didn't log in successfully
                        self.displayErrors("Invalid username or password");
                    } else {    
                        data = JSON.parse(data);

                        self.completeLogin(username, csrfmiddlewaretoken, data.sessionid);
                    }
                },
                error : function(jqXHR, textStatus, errorThrown) {
                    self.displayErrors("Unable to connect, try again later.")
                }
            });
        } else {
            self.completeLogin(username);
        }
    },

    completeLogin : function(username, csrftoken, sessionid) {
        if (csrftoken) { 
            userChange('setCookie', 'csrftoken', csrftoken);
        }
        if (sessionid) { 
            userChange('setCookie', 'sessionid', sessionid);
        }

        $('#login_container').remove();

        loggedIn = true;

        userChange('login');

        userChange('setUsername', username);
        navView.render('home_tab');
        homeView = new HomeView();
        
        // Update user attributes in localStorage
        userChange('completeLogin');
    },

    logout : function() {
        $.get(url_logout());
        userChange('logout');
        this.render();
    },

    displayErrors : function(errorMsg) {
        $('#login').button('reset');
        var $errorDiv = $('#errors');
        $errorDiv.html(errorMsg);
        $errorDiv.fadeIn();
    },

});

NavView = Backbone.View.extend({
    'el' : $('.nav-container'),

    initialize : function(){
        this.render('home_tab');
        $('.brand').blur()
    },

    render : function(tab) {
        $('.nav-container').empty();
        var loggedIn = loggedIn;
        var template = _.template($("#nav_template").html(), {
                baseUrl : 'baseUrl',
                loggedIn : loggedIn,
            });

        $(this.el).html(template);
        if (!loggedIn) {
            tab = "login_tab"
        }
        $('nav-tab').removeClass('active');
        $('#' + tab).addClass('active').click();
    },
});

HomeView = Backbone.View.extend({
    'el' : $('.content-container'),

    initialize : function(){
        this.render()
    },

    render : function() {
        if (!loggedIn) {
            return
        }
        var template = _.template($("#splash_template").html());
        $(this.el).html(template);
    },
});

function clickHandle(e) {
    e.preventDefault();
    var url = $(e.target).context.href;
    if (url.indexOf("logout") !== -1) {
        doLogout();          
    } else {
        backpage.openLink(url)    
    }
}

function doLogout() {
    $.get(url_logout());
    userChange('logout');
    loginView.render();
}    

///////////////////URL BUILDERS///////////////////
function url_login() {
    return baseUrl + '/accounts/login/'
}

function url_logout() {
    return baseUrl + '/accounts/logout/'
}


////////send requests to proxy server ///////
function proxy_url() {
    return proxyUrl
}

function addProxyParam(url, cookies){
    return proxy_url() + "?proxy_url=" + url + "&csrftoken=" + cookies.csrftoken
}

function getCookies(data){
    var cookies = {};
    cookies.csrftoken = data.csrfmiddlewaretoken;
    return cookies
}

function ajaxWrapper(params){
    if (!params.url){
        console.error('ajax request made without url');
        return false;
    }
    var data = params.data || {};
    var cookies = getCookies(data);
    var url;
    if (params.type === "GET") {
        data.cookies = cookies
        data.proxy_url = params.url;    
        params.data = data;
        url = proxy_url();
    } else {
        url = addProxyParam(params.url, cookies);
    }
    params.url = url
    $.ajax(params);
}


///////SEND USER ACTIONS TO CONTENT SCRIPT //////

function userChange(func, args){
    var args = Array.prototype.slice.call(arguments, 1); // if any args present
    self.port.emit("userChange", {
        'func': func,
        'args': args,
    });
}


// Listen for the "show" event being sent from the
// main add-on code. It means that the panel's about
// to be shown.
self.port.on("show", function onShow(data) {
    baseUrl = data.baseUrl;
    proxyUrl = data.proxyUrl;
    loggedIn = data.loggedIn; //user login state
    navView =  new NavView();
    loginView = new LoginView(); 
    var homeView;
    if (loggedIn){
        homeView = new HomeView();
    }
    $(document).click('#home_tab', function(){
        if (homeView != undefined) {
            homeView.render();
        }
    });
    $('a').click(clickHandle);
});