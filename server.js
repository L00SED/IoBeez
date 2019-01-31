"use strict";

process.title = 'dashboard-live';

// Port running the WebSocket server
var webSocketsServerPort = 1337;

// WebSocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/* Global variables */
// Full data points on latest 100
var history = [];
// Individual histories
var temperatureHist = [];
var smokeHist = [];
var electricityHist = [];
var motionHist = [];

// list of currently connected clients (users)
var clients = [];

// This handles static file serving
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');
var serve = serveStatic("./");

/* Current values and value ranges */
// Array for temperature
var tR = [-20, 120];
var temperature = 72; 
// Array for smoke
var sR = [0, 100];
var smoke = 0;
// Array for electricity
var eR = [0, 5000];
var electricity = 1253;
// Array for motion
var mR = [0, 1];
var motion = 1;

// Generate random value from ranges
function genValue(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Functions for simulating sensor data reception at intervals
function setTemperature() {
  setInterval(function() {
    var change = genValue(-5, 5);
    if ((temperature + change) > tR[1] || (temperature + change) < tR[0]) {
      return temperature;
    } else {
      temperature += change;
      return temperature;
    }
  }, 30000);
};
function setSmoke() {
  setInterval(function() {
    var change = genValue(-5, 5);
    if ((smoke + change) > sR[1] || (smoke + change) < sR[0]) {
      return smoke;
    } else {
      smoke += change;
      return smoke;
    }
  }, 60000);
};
function setElectricity() {
  setInterval(function() {
    var change = genValue(-500, 500);
    if ((electricity + change) > eR[1] || (electricity + change) < eR[0]) {
      return electricity;
    } else {
      electricity += change;
      return electricity;
    }
  }, 1000);
};
function setMotion() {
  setInterval(function() {
    var change = genValue(0, 1);
    motion = mR[change];
    return motion;
  }, 30000);
};
setTemperature();
setSmoke();
setElectricity();
setMotion();

/* HTTP server */
var server = http.createServer(function(request, response) {
  var done = finalhandler(request, response);
  serve(request, response, done);
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/* WebSocket server */
var wsServer = new webSocketServer({
  httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

  // accept connection - you should check 'request.origin' to make sure that
  // client is connecting from your website
  var connection = request.accept(null, request.origin); 
  // we need to know client index to remove them on 'close' event
  var index = clients.push(connection) - 1;
  console.log((new Date()) + ' Connection accepted.');
  // Send sensor data history
  if (temperatureHist.length > 0) {
    connection.sendUTF(JSON.stringify( { type: 'history', data: temperatureHist } ));
  }
  if (smokeHist.length > 0) {
    connection.sendUTF(JSON.stringify( { type: 'history', data: smokeHist } ));
  }
  if (electricityHist.length > 0) {
    connection.sendUTF(JSON.stringify( { type: 'history', data: electricityHist } ));
  }
  if (motionHist.length > 0) {
    connection.sendUTF(JSON.stringify( { type: 'history', data: motionHist } ));
  }
  // user sent some message
  setInterval(function() {
    var obj = {
      time: (new Date()).getTime(),
      temperature: temperature,
      smoke: smoke,
      electricity: electricity,
      motion: motion
    };
    history.push(obj);
    history = history.slice(-100);
    console.log(history);
    // broadcast message to all connected clients
    var json = JSON.stringify({ type:'data', data: obj });
    console.log(json);
    for (var i=0; i < clients.length; i++) {
      clients[i].sendUTF(json);
    }
  }, 1000);

    // user disconnected
    connection.on('close', function(connection) {
      console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
      // remove user from the list of connected clients
      clients.splice(index, 1);
    });
  });
