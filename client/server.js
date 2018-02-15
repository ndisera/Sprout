var express = require('express');
var path = require('path');
const httpolyglot = require('httpolyglot');
const fs = require('fs'); // FileSync module, for loading HTTPS keys

// deal with command line arguments
// error check for malformed arguments
var args = process.argv.slice(2);
if(args.length % 2 != 0) { 
  console.log("every argument flag must have a value.");
  process.exit(1);
}

// initialize default values and change them based on args
var port = 8001;
var http_port = 8003;
var https_port = 8002;
var folder = '/public';

var cur = 0;
while(cur < args.length) {
  switch(args[cur]) {
    case '-p': // Main port
      cur++;
      port = args[cur];
      cur++;
      break;

    case '-pu': // Port Unsecure
        cur++;
        http_port = args[curr];
        cur++
        break;

    case '-ps': // Port Secure
      cur++;
      https_port = args[curr];
      cur++;

    case '-f':
      cur++;
      folder = args[cur];
      cur++;
      break;
  }
}

var folder_path = path.join(__dirname, folder);

// Setup HTTPS(with HTTP redirect) server
const options = {
  key: fs.readFileSync(path.join(__dirname, '../pki/private_frontend_key.key')),
  cert: fs.readFileSync(path.join(__dirname, '../pki/frontend_cert.pem'))
};

var express_app = express();
express_app.use(express.static(folder_path));
express_app.all('*', function(req, res) {
  res.sendFile(folder_path + '/index.html');
});
var server = httpolyglot.createServer(options, function (req, res) {
  if (!req.socket.encrypted) {
      res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
      return res.end();
  }
  express_app(req, res);
});
server.listen(port);

console.log("Sprout server is serving " + folder_path);
console.log('Use port ' + port + ' to connect to Sprout.');

exports = module.exports = server;





