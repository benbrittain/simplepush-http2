process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var http2 = require('http2');

var monitor = null;
var channel = null;

var first = function(){
    var options = {
        host: 'localhost',
        port: 8080,
        path: '/',
        method: 'POST'
    };
    var request = http2.request(options);
    var monitorPattern = new RegExp('<(.*)>;rel=\"...:push:monitor\"');
    var channelPattern = new RegExp(',<(.*)>;rel=\"...:push:channel\"');
    request.on('response', function(res) {
        monitor = res.headers.link.match(monitorPattern)[1];
        channel = res.headers.link.match(channelPattern)[1];
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        console.log('monitor: ' + monitor);
        console.log('channel: ' + channel);

        var options = {
            host: 'localhost',
            port: 8080,
            path: '/'+ monitor,
            method: 'GET'
        };
        var request = http2.request(options);
        request.on('response', function(res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
        });
        request.on('push', function(pushRequest) {
        //    console.error('Receiving pushed resource: ' + pushRequest.url + ' -> ' + filename);
            pushRequest.on('response', function(pushResponse) {
                console.log('wtf');
                pushResponse.on('response', function(){console.log('hah');});
            });
        });
    });
}

//    request.on('push', function(pushRequest) {
//    //    console.error('Receiving pushed resource: ' + pushRequest.url);
//        pushRequest.on('response', function(res) {
//            console.log('----------PUSH_FRAME----------');
//            console.log('STATUS: ' + res.statusCode);
//            console.log('HEADERS: ' + JSON.stringify(res.headers));
//            // TODO: MORE ROBUST regex
//            var monitorPattern = new RegExp('<(.*)>;rel=\"...:push:monitor\"');
//            var channelPattern = new RegExp(',<(.*)>;rel=\"...:push:channel\"');
//            var monitor = res.headers.link.match(monitorPattern)[1];
//            var channel = res.headers.link.match(channelPattern)[1];
//            var options2 = {
//                host: 'localhost',
//                port: 8080,
//                path: '/' + channel,
//                method: 'POST'
//            };
//            var request = http2.request(options2);
//            //        pushResponse.pipe(fs.createWriteStream(filename)).on('finish', finish);
//        });
//    });

first();
