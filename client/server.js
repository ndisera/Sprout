var express = require('express');
var path = require('path');
const https = require('https'); // HTTPS server module
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
var folder = '/public';

var cur = 0;
while(cur < args.length) {
  switch(args[cur]) {
    case '-p':
      cur++;
      port = args[cur];
      cur++;
      break;

    case '-f':
      cur++;
      folder = args[cur];
      cur++;
      break;
  }
}

var folder_path = path.join(__dirname, folder);

// Setup HTTPS server
const options = {
  key: fs.readFileSync('pki/private_frontend_key.key'),
  cert: fs.readFileSync('pki/frontend_cert.pem')
};

var server = https.createServer(options, express.static(folder_path)).listen(port);

console.log("Sprout server is serving " + folder_path);
console.log('Use port ' + port + ' to connect to Sprout.');

exports = module.exports = server;





