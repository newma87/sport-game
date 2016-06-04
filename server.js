var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Serial = require('serialport');
var SerialPort = Serial.SerialPort;

var selectedPort;
var portStatus = 'undefined';

// manager the clients
var clients = [];
function addClient(client) {
  clients.push(client);
}
function removeClient(client) {
  var index = clients.indexOf(client);
  if (index != -1) {
    clients.splice(index, 1);
    return true;
  }
  return false;
}
function doAction() {
  for (var i = clients.length - 1; i >= 0; i--) {
    console.log('emit a signal to client{' + clients[i].id + '}');
    clients[i].emit('signal');
  };
}

// read serial port
Serial.list(function(err, ports) {
  if (err) {
    console.log('list serial port failed!');
    return;
  }

  ports.forEach(function(port) {
    var reg = new RegExp("usbmode");
    if (reg.test(port.comName)) {
      selectedPort = port.comName;
      console.log("find com port name :" + selectedPort);
      return;
    }
  });

  if (selectedPort != undefined && selectedPort != "") {
    var serial = new SerialPort(selectedPort, {
    baudrate: 9600,
    parser: Serial.parsers.readline('\r\n')
    });

    serial.on('open', function() {
      console.log('open serial port successfully!');
      portStatus = 'Opened';
    });

    serial.on('data', function(data) {
      //console.log("recieve string: " + data);
      var reg = new RegExp("s");
      if (reg.test(data)) {
        console.log('receive signal...');
        doAction();
      }
    });

    serial.on('close', function() {
      console.log('serial port closed!');
      portStatus = 'Closed';
    });

    serial.on('error', function(err) {
      console.log('[Error]: error ocured! ' + err);
      portStatus = 'Error'
    });
  } else {
    console.log('[Error]: Counld not found proper serial port!');
  }
});

app.use('/game', express.static(__dirname + '/dist'));

// setup server
app.get('/', function(req, res) {
    res.send('Serial port name: ' + selectedPort + '<br>Serial port status: ' + portStatus + '<br><h1>Current activity connection count: ' + clients.length + '</h1>');
});

http.listen(3000, function() {
    console.log('listening on localhost:3000');
});

io.on('connection', function(socket) {
  addClient(socket);
  console.log("Client[" + socket.id + "] connect");

  socket.on('disconnect', function() {
    console.log("socket " + socket.id + " disconnect!");
    if (removeClient(socket)) {
      console.log("Client[" + socket.id + "] terminated at disconnect");
    }
  });
});
