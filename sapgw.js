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

    return cookie;
};

var getSessionCookie = function (res) {
    var cookiesTxts = res.headers["set-cookie"],
        MYSAPSSO2 = "MYSAPSSO2",
        sessionCookie;

    if (cookiesTxts) {
        cookiesTxts.forEach(function (txt) {
            var cookie = parseCookie(txt);
            if (cookie.name === MYSAPSSO2) {
                sessionCookie = cookie;
            }
        })
    };

    return sessionCookie;

}

var parseProperties = function (properties) {
    var obj = {}, name, value, key;

    for (name in properties) {
        key = name.substring(2);
        value = properties[name]['#'] || properties[name]

        if (key) {
            if (typeof value == 'string') {
                obj[key] = value
            } else {
                // if value is not a string, 
                // recursively parse the properties
                obj[key] = parseProperties(value);
            }
        }
    };

    return obj;
}

var parseEntry = function (entry) {
    var obj,
        properties = entry['atom:content']['m:properties'];

    obj = parseProperties(properties);
    obj.id = entry['atom:id'];

    return obj;
}

var parseResponse = function (xml, callback) {

    var parser = new xml2js.Parser({
        emptyTag: ''
    });

    parser.on('end', function (js) {

        //console.log(js);

        var entries = js['atom:entry'],
            results;

        if (!entries) {
            // response for single entry
            results = parseEntry(js)
        } else {
            // response for collection
            results = [];
            entries.forEach(function (entry) {
                var entity = parseEntry(entry)
                results.push(entity)
            })
        }

        callback(results)
    });

    parser.parseString(xml);
};

// just convert xml to js
var parseXml = function (xml, callback) {
    var parser = new xml2js.Parser({
        emptyTag: ''  // use empty string as value when tag empty
    });

    parser.on('end', function (js) {
        callback && callback(js)
    });

    parser.parseString(xml);
};

// Constructor function for Gateway service
Gateway = function (options) {
    this.username = options.username;
    this.password = options.password;
    this.host = options.host;
    this.service = options.service;
    this.authenticated = false;
};

Gateway.prototype = {

    // private helper method
    // fill request header with appropriate headings for authentication
    _authenticate: function (options) {
        var gw = this;

        if (!gw.authenticated) {
            // if not yet authenticated: send Basic Authorization header
            options.headers = {
                'Authorization': 'Basic ' + new Buffer(gw.username + ':' + gw.password).toString('base64')
            }
        } else {
            // if authenticatio was successfull: send sessionToken
            options.headers = {
                'Cookie': 'MYSAPSSO2=' + gw.sessionToken
            }
        }
    },

    // raw request to Gateway,
    // handles authentication
    // returns XML response via callback
    get: function (options, callback) {
        var gw = this;

        gw._authenticate(options);
        console.log(options)
        http.get(options, function (res) {
            var xml = '';

            res.on("data", function (chunk) {
                xml += chunk;
            });

            res.on("end", function () {
                console.log(xml);

                if (res.statusCode != "200") {
                    console.log("HTTP error: ", res.statusCode);
                    return;
                }

                if (!gw.authenticated) {
                    gw.sessionToken = getSessionCookie(res).value;
                    gw.authenticated = true;
                }
                console.log(xml);
                callback(xml)

            });
        })
    },

    // Request collection or entity
    // return an array of JS objects
    // or single object.
    request: function (id, callback) {
        var gw = this,
            parts = id.split('/'),
            req = parts[parts.length - 1];

        var options = {
            host: gw.host,
            path: gw.service + '/' + req
        };

        gw.get(options, function (xml) {
            parseResponse(xml, callback)
        })
    },

    // Get metadata description of
    // SAP Gateway service
    metadata: function (callback) {
        var gw = this;

        var options = {
            host: gw.host,
            path: gw.service + '/$metadata'
        };

        gw.get(options, function (xml) {
            parseXml(xml, callback)
        })
    },

    // Get consumption model (= available collections)
    // of SAP Gateway service
    collections: function (callback) {
        var gw = this;

        var options = {
            host: gw.host,
            path: gw.service + '/'
        };

        gw.get(options, function (xml) {
            parseXml(xml, function (js) {
                var collections = js['app:workspace']['app:collection'];
                callback(collections)
            })
        })
    }
}


module.exports = Gateway;