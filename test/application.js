// test application
var http2 = require('/home/ben/workspace/mozilla-central/testing/xpcshell/node-http2');
var fs = require('fs');

var options = {
    key: fs.readFileSync('./config/server.key'),
    cert: fs.readFileSync('./config/server.crt')
};

var channels = [];
started = false;
function requestHandler(request, res) {
    if (request.httpVersion === '2.0') {
        res.setHeader('X-Connection-Http2', 'yes');
    } else {
        console.log("wat.");
    }

    var args = request.url.split('?');
    console.log(args);
    if (request.url === '/') {
        res.writeHead(200);
        console.log('serving page');
        fs.readFile('./test/application.html', 'utf-8', function(err, content){
            res.write(content);
            res.end();
        });
    } else if (args[0] === '/register') {
        console.log(request);
        channels.push(args[1].split('=')[1]);

        if (started == false){
            started=true;
            setInterval(annoy, 2000);
        }

    } else {
        console.log(request);
        res.writeHead(404);
    }
}

function annoy() {
    for (var i in channels) {
        console.log('pinging channel ' + channels[i] + ' with random string');

        // MAKE HTTP REQUEST TO THE SERVER
    }
}

var server = http2.createServer(options, requestHandler);
server.listen(8000);
