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

var checkChat = { // Start of refactoring
    sessions: [],
    users: {},
    socketsToUsernames: {},
    roomsNew: {
        public: {
            key_name: 'public',
            name: "public_room",
            users: {}
        },
        naughty: {
            key_name: 'naughty',
            name: "naughty_room",
            users: {}
        }
    },
    addUserToRoom: function(username, socketId, room) {
        console.log('adding "' + username + '" to ' + '"' + room + '"');

        this.socketsToUsernames[socketId] = username;
        this.roomsNew[room].users[username] = {
            username: username,
            socketId: socketId
        }
    },
    removeUserFromRoom: function(socketId, room) {
        console.log('removing "' + this.getUsernameFromSocketId(socketId) + '" from ' + '"' + room + '"');

        delete this.roomsNew[room].users[checkChat.getUsernameFromSocketId(socketId)];
        delete this.socketsToUsernames[socketId];
        //delete this.
    },
    getUsernameFromSocketId: function(socketId) {
        return this.socketsToUsernames[socketId];
    },
    numOfUsersInCurentRoom: function(room) {
        var keys = Object.keys(this.roomsNew[room].users);
        return keys.length;
    },
    getUsernamesFromRoom: function(room) {
        var usersString = "";
        var keys = Object.keys(this.roomsNew[room].users);

        for(var i = 0; i < keys.length; i++) {
            if(usersString !== "") {
                usersString += ", ";
            }
            usersString += this.roomsNew[room].users[keys[i]].username;
        }
        return usersString;
    },
    enableSoundForSocket: function(socketId) {
        return false;
    },
    disableSoundForSocket: function(socketId) {
        return false;
    }
};

nsp.on('connection', function(socket){

    socket.on('disconnect', function() {
        checkChat.removeUserFromRoom(socket.id, 'public');
        //nsp.emit('num of users', checkChat.numOfUsers());
        //nsp.emit('usernames', checkChat.allUsersString());
    });

    socket.on('chat message', function(obj){
        nsp.emit('chat message', obj);
    });

    socket.on('username', function(username) {

        checkChat.addUserToRoom(username, socket.id, checkChat.roomsNew.public.key_name);
        socket.join(checkChat.roomsNew.public.name);

        nsp.emit('num of users', checkChat.numOfUsersInCurentRoom(checkChat.roomsNew.public.key_name));
        nsp.emit('usernames', checkChat.getUsernamesFromRoom(checkChat.roomsNew.public.key_name));
    });

    socket.on('change room', function(data) {
        //socket.leave(socket.room);
        //socket.join(room);

        var username = checkChat.getUsernameFromSocketId(socket.id);
        checkChat.removeUserFromRoom(socket.id, checkChat.roomsNew[data.oldRoomName].key_name);
        checkChat.addUserToRoom(username, socket.id, data.newRoomName);

        newData = {
            room: data.newRoomName,
            numOfUsers: checkChat.numOfUsersInCurentRoom(data.newRoomName),
            usernames: checkChat.getUsernamesFromRoom(data.newRoomName)
        };
        nsp.emit('change room', newData);
    });

});