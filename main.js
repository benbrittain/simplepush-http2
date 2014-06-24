/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
// Ben Brittain

"use strict"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


var fs = require('fs');
//var http2 = require('http2')
var http2 = require('/home/ben/workspace/mozilla-central/testing/xpcshell/node-http2')
//var uuid = require('node-uuid');


// Global Variables
var default_port = 7999;

var options = {
    key: fs.readFileSync('./config/server.key'),
    cert: fs.readFileSync('./config/server.crt')
};
//var options = {
//  key: fs.readFileSync('/home/ben/workspace/mozilla-central/testing/xpcshell/moz-spdy/spdy-key.pem'),
//  cert: fs.readFileSync('/home/ben/workspace/mozilla-central/testing/xpcshell/moz-spdy/spdy-cert.pem'),
//  ca: fs.readFileSync('/home/ben/workspace/mozilla-central/testing/xpcshell/moz-spdy/spdy-ca.pem'),
//};



function uniqueURL() {
    // TODO: better URI
    var address = Math.random().toString(36).substring(2);
    return address;
}

function Session() {
    this.monitorURL = uniqueURL();
    this.channelURL = uniqueURL();
    this.channels = [];
    this.push = null;
}


Session.prototype.createChannel= function createChannel() {
    console.log(this.channelURL + " called (create channel)");
    var id = uniqueURL();
    this.channels.push(' ' + id);
    route(id, 'channel', this);
    console.log(routes);
    return id;
};

//Session.prototype = Object.create(Session.prototype, { constructor: { value: Session } })

var routes = {};

function route (path, type, sess) {
    if (!(type == 'monitor' || type == 'channel_creator' || type == 'channel')) {
        console.log('Not a valid resource type');
    }
    routes[path] = {'type': type, 'session': sess}
}


var server = http2.createServer(options, function(request, response) {
    var url = request.url.substring(1);
    if (request.httpVersion != '2.0'){
        console.error('wtf');
    }
    // If not accessing a monitor or channel URI, might be a new device
    console.log(request.method);
    if (request.url == '/' && request.method == 'POST'){
        console.log("New Device connecting");
        // Initialize Push Frame
        var sess = new Session();
        response.writeHead(200, {'Content-Type': 'text/plain',
                                 'Link': '<' + sess.monitorURL +'>;rel="...:push:monitor",' +
                                         '<' + sess.channelURL +'>;rel="...:push:channel"',
                                 'Expires': new Date()});

        // Add the monitor URLs to the routes object
        route(sess.monitorURL, 'monitor', sess);
        route(sess.channelURL, 'channel_creator', sess);
        console.log(routes);
        response.end();

    } else if (request.method == 'GET' && routes[url]) {
        if(routes[url].type == 'monitor') {
            // start of device monitoring for push requests
            console.log('get, monitor');
            response.writeHead(200)
                var push = response.push(JSON.stringify(options));

            for(var i = 1; i < 5; i++){
                console.log(i);
                ////            push.writeContinue(i);
                fs.createReadStream('./config/'+ i).pipe(push);
            }
        }

    } else if (request.method == 'POST' && routes[url]){
        if (routes[url].type == 'channel_creator') {
            var session = routes[url].session;
        console.log('post, channel_creator');
        var channelURI = session.createChannel()
        console.log(channelURI + ' new channel');
        response.writeHead(201, { 'Location' : channelURI,
                                  'Expires': new Date()});
        }
        response.end();

    } else if (request.method == 'POST' && routes[url].type == 'channel') {
        console.log(routes[url].type);
        console.log('post, channel');
    }

});


server.listen(default_port);
