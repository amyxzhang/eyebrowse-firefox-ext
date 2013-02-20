LoginView = Backbone.View.extend({
    'el' : $('.content-container'),

    initialize : function() {
        _.bindAll(this);
        this.render();
    },

    render : function() {
        if (!false){//user.isLoggedIn()) {
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
            // $.ajax({
            //     headers: {
            //         // Send the token to same-origin, relative URLs only.
            //             // Send the token only if the method warrants CSRF protection
            //             // Using the CSRFToken value acquired earlier
            //             "x-csrftoken": csrfmiddlewaretoken,
            //     },
            //     xhrFields: {
            //         // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
            //         // This can be used to set the 'withCredentials' property.
            //         // Set the value to 'true' if you'd like to pass cookies to the server.
            //         // If this is enabled, your server must respond with the header
            //         // 'Access-Control-Allow-Credentials: true'.
            //         withCredentials: true,
            //     },
            //     url: url_login(),
            //     type: "POST",
            //     data: {
            //             "username": username,
            //             "password": password,
            //             "csrfmiddlewaretoken" : csrfmiddlewaretoken,
            //             "remember_me": 'on', // for convenience
            //     },
            //     dataType: "html",
            //     success: function(data, textStatus, jqXHR) {
            //         var match = data.match(REGEX)
            //         if(match) { // we didn't log in successfully
                        
            //             self.displayErrors("Invalid username or password");
            //         } else {
                        
            //             self.completeLogin(username)
            //         }
            //     },
            //     error : function(jqXHR, textStatus, errorThrown) {
            //         console.log(JSON.stringify(arguments))
            //         self.displayErrors("Unable to connect, try again later.")
            //     }
            // });
            var url = url_login();

            var xhr = createCORSRequest('POST', url);
            if (!xhr) {
                console.log('CORS not supported');
                return;
            }
            xhr.setRequestHeader('X-CSRFToken', csrfmiddlewaretoken);
            xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
            // xhr.withCredentials = true;

            // Response handlers.
            xhr.onload = function() {
                console.log(JSON.stringify(xhr))
                var text = xhr.responseText;
                var match = data.match(REGEX)
                console.log("res text", text)
                if(match) { // we didn't log in successfully
                    self.displayErrors("Invalid username or password");
                } else {
                    self.completeLogin(username)
                }
            };

            xhr.onerror = function() {

                console.log("err args", JSON.stringify(arguments));
            };
            var params = "username=" + username + "&password=" + password + "&csrfmiddlewaretoken=" + csrfmiddlewaretoken + "&remember_me=on";
            xhr.send(params)
            console.log(JSON.stringify(xhr))
        }
        else {
            self.completeLogin(username);
        }
    },

    completeLogin : function(username) {
        $('#login_container').remove();
        $('body').css('width', '400px');

        user.login();
        user.setUsername(username);
        navView.render('home_tab');
        homeView = new HomeView();
        
        //
        // Update user attributes in localStorage
        //
        user.getBlacklist().fetch({
            success: function (data) {
                user.saveState();
            }
        });
        user.getWhitelist().fetch({
            success: function (data) {
                user.saveState();
            }
        });
    },

    logout : function() {
        $.get(url_logout());
        user.logout();
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
        var loggedIn = false;//user.isLoggedIn();
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
        if (!user.isLoggedIn()) {
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
    user.logout();
    backpage.clearLocalStorage('user')
    loginView.render();
}    

///////////////////URL BUILDERS///////////////////
function url_login() {
    return baseUrl + '/accounts/login/'
}

function url_logout() {
    return baseUrl + '/accounts/logout/'
}

////////////// AJAX CSRF PROTECTION///////////

// Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}
  
// Listen for the "show" event being sent from the
// main add-on code. It means that the panel's about
// to be shown.
self.port.on("show", function onShow(data) {
    baseUrl = data.baseUrl;
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
    $('a').click(clickHandle)
});