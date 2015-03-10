var express = require('express');
var app = express().use(express.static(__dirname + '/'));
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function() {
    console.log('listening on  *:3000');
});

var nsp = io.of('/app');

var sessions = [];
var users = {};
var usernames = {};

nsp.on('connection', function(socket){

    socket.join('test_room');

    //numOfClients: Object.keys(nsp.adapter.rooms['test_room']).length,
    //nsp.emit('user connected', Object.keys(nsp.adapter.rooms['test_room']).length)
    //console.log(Object.keys(nsp.adapter.rooms['test_room']).length);

    socket.on('disconnect', function() {
        delete users[socket.id];

        var userstemp = "";
        var keys = Object.keys(users);
        for(var i = 0; i < keys.length; i++) {
            if(userstemp !== "") {
                userstemp += ', ';
            }
            userstemp += ', ' + users[keys[i]].username;
        }

        nsp.emit('usernames', userstemp);
    });

    socket.on('chat message', function(obj){
        nsp.emit('chat message', obj);
    });

    socket.on('username', function(username) {
        users[username] = {
            username: username,
            socketId: socket.id
        };

        var userstemp = "";
        var keys = Object.keys(users);
        for(var i = 0; i < keys.length; i++) {
            if(userstemp !== "") {
                userstemp += ', ';
            }
            userstemp += users[keys[i]].username;
        }

        nsp.emit('usernames', userstemp);
        //console.log(users);
    });

});