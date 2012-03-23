var http = require('http'),
    xml2js = require('xml2js');


var parseCookie = function (txt) {

    var properties = txt.split('; '),
        cookie = {};

    properties.forEach(function (prop, index) {
        var parts = prop.split('='),
            name = parts[0].trim(),
            value = parts[1].trim();

        if (index == 0) {
            cookie.name = name,
            cookie.value = value
        } else {
            cookie[name] = value
        }

    })
    
    return cookie
};

var getSessionCookie = function (res) {
    var cookiesTxts = res.headers["set-cookie"],
        sessionCookie;

    if (cookiesTxts) {
        cookiesTxts.forEach(function (txt) {
            var cookie = parseCookie(txt);
            if (cookie.name == "MYSAPSSO2") {
                sessionCookie = cookie;
            }
        })
    }

    return sessionCookie;

}

var parse = function (xml, callback) {

    var parser = new xml2js.Parser();

    parser.on('end', function (json) {
        callback && callback(json['atom:entry'])
    });   
    
    parser.parseString(xml);
},



Gateway = function (options) {
    this.username = options.username || 'GW@ESW';
    this.password = options.password || 'ESW4GW';
    this.host = options.host || '';
    this.path = options.path || '';
    this.service = options.service || '';

    this.authenticated = false;
}

Gateway.prototype = {


    request: function (options, callback) {
        var gw = this;

        var http_options = {
            host: gw.host,
            path: [gw.path, gw.service, options.collection || ''].join('/')
        };
        //console.log(gw);
        if (!gw.authenticated) {
            // if not authenticated: send Basic Authorization header
            http_options.headers = {
                'Authorization': 'Basic ' + new Buffer(gw.username + ':' + gw.password).toString('base64')
            }
        } else {
            // if already authenticated: send sessionToken
            http_options.headers = {
                'Cookie': 'MYSAPSSO2=' + gw.sessionToken
            }
        }

        http.get(http_options, function (res) {
            var xml = '';
            //console.log(http_options);

            res.on("data", function (chunk) {
                xml += chunk;
            });

            res.on("end", function () {
                console.log("Status", res.statusCode);

                if (res.statusCode != "200") {
                    return;
                }

                if (!gw.authenticated) {
                    gw.sessionToken = getSessionCookie(res).value;
                    gw.authenticated = true;
                }

                parse(xml, callback)

            });
        })

    },

    fetch: function (collection) {
        this.request();
    }
}


module.exports = Gateway;