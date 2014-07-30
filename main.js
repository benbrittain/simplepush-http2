/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
// Ben Brittain

"use strict"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var fs = require('fs');
var http2 = require('http2')
//var http2 = require('/home/ben/workspace/mozilla-central/testing/xpcshell/node-http2')
//var uuid = require('node-uuid');


// Global Variables
var default_port = 7999;

var options = {
    key: fs.readFileSync('./config/server.key'),
    cert: fs.readFileSync('./config/server.crt')
};

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
    return id;
};

var routes = {};

function route (path, type, sess) {
    if (!(type == 'monitor' || type == 'channel_creator' || type == 'channel')) {
        console.log('Not a valid resource type');
    }
    routes[path] = {'type': type, 'session': sess}
}

var server = http2.createServer(options, function(request, response) {
    var url = request.url.substring(1);
    //console.log(request);
    console.log("request: " + url + " m: " + request.method)
    if (request.httpVersion != '2.0'){
        console.error('wtf');
    }

    // If not accessing a monitor or channel URI, might be a new device
    if (request.url == '/' && request.method == 'POST'){
        console.log("New Device connecting");

        // Initialize Session
        var sess = new Session();
        response.writeHead(200, {'Content-Type': 'text/plain',
                                 'Link': '<' + sess.monitorURL +'>;rel="...:push:monitor",' +
                                         '<' + sess.channelURL +'>;rel="...:push:channel"',
                                 'Expires': new Date()});

        // Add the monitor URLs to the routes object
        route(sess.monitorURL, 'monitor', sess);
        route(sess.channelURL, 'channel_creator', sess);
        response.end();

    } else if (request.method == 'GET' && routes[url]) {
        if(routes[url].type == 'monitor') {

            // Start of device monitoring for push requests
            console.log('GET, monitorURL: ' + url);
            routes[url].session.response = response;
        } else {
            response.writeHead(404);
        }
    } else if (request.method == 'POST' && routes[url]){
        if (routes[url].type == 'channel_creator') {
            console.log('post, channel_creator');

            // Create a channel for the session
            var session = routes[url].session;
            var channelURI = session.createChannel();

            // Initialize the Push for the new channel
            var push = session.response.push('/'+channelURI);
            console.log(channelURI + ' new channel');
            push.writeHead(200, {
                'content-type': 'text/plain',
                'pushed' : 'yes',
                'X-Connection-Http2': 'yes'
            });
            console.log('channelURI for pushing too: ' + channelURI);
            routes[channelURI].push = push;

            // Respond to POST request with the location of the new channelURI
            response.writeHead(201, {
                'Location' : "https://" + request.host + '/' + channelURI + "/",
                'Expires': new Date()
            });
            response.end();
        }
    } else if (request.method == 'PUT' && routes[url].type == 'channel') {
        console.log('PUT: ' + url);
        request.on('data', function (chunk) {
            var push = routes[url].push;
            console.log('writing \"' + chunk + '\" to ' + url)
            push.write(chunk);
        });
    } else {
        console.log(request);
        response.writeHead(404);
        response.end();
    }

});

server.listen(default_port);
