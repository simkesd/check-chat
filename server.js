var express = require('express');
var app = express().use(express.static(__dirname + '/'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require("underscore");

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function() {
    console.log('listening on  *:3000');
});

var nsp = io.of('/app');

var checkChat = {
    /*
        Properties
     */
    roomLimit: 3,
    defaultRoom: 'public_room',
    socketsToUsernames: {},
    usernamesToSockets: {},
    socketsToRooms: {},
    roomsToUsers: {
        'public_room': [],
        'programming_room': []
    },

    /*
        Methods
     */
    addUser: function() {

    },
    removeUse: function() {

    },
    usernameExist: function(username) {
        if(this.usernamesToSockets[username] === undefined) {
            return false;
        }else {
            return true;
        }
    }
    ,
    roomHasFreeSpace: function(room) {
        if(checkChat.roomsToUsers[room].length >= this.roomLimit) {
            return false;
        }else {
            return true;
        }
    },
    countRoomMembers: function(room) {
        return checkChat.roomsToUsers[room].length;
    },
    test: function() {

    }
};

nsp.on('connection', function(socket){

    socket.on('disconnect', function() {
        var username = checkChat.socketsToUsernames[socket.id];
        var room = checkChat.socketsToRooms[socket.id];

        checkChat.socketsToRooms[room] = _.omit(checkChat.socketsToRooms[room], username);
        checkChat.socketsToUsernames = _.omit(checkChat.socketsToUsernames, socket.id);
        checkChat.usernamesToSockets = _.omit(checkChat.usernamesToSockets, username);
        checkChat.roomsToUsers[room] = _.without(checkChat.roomsToUsers[room], username);

        nsp.to(room).emit('user disconnected', { username: username});
        nsp.to(room).emit('num of users changed', { numOfUsers: checkChat.countRoomMembers(room)});
    });

    socket.on('set username', function(username) {
        if(username === undefined) {
            nsp.to(socket.id).emit('error', { "userNameInUse" : true });
            return;
        }
        if(!checkChat.usernameExist(username)) {
            if(!checkChat.roomHasFreeSpace(checkChat.defaultRoom)) {
                console.log('room has no free space');
                nsp.to(socket.id).emit('error', { message: "There is no space in " + checkChat.defaultRoom});
                return;
            }

            /*
                Saving user data.
                With this data we can manipulate with users name, socket id and room
             */
            checkChat.usernamesToSockets[username] = socket.id;
            checkChat.socketsToUsernames[socket.id] = username;
            checkChat.roomsToUsers[checkChat.defaultRoom].push(username.toString());
            checkChat.socketsToRooms[socket.id] = checkChat.defaultRoom;

            /*
                Connect user to single room
             */
            socket.join(checkChat.defaultRoom);

            nsp.to(checkChat.defaultRoom).emit('num of users changed', { numOfUsers: checkChat.countRoomMembers(checkChat.defaultRoom)});


            /*
                Send welcome message to user that connected and send a list
                of user currently connected to default room
             */
            console.log('Sending welcome msg to ' + username + ' at ' + socket.id);
            nsp.to(socket.id).emit('welcome', {
                "username" : username,
                "currentUsers": JSON.stringify(
                    checkChat.roomsToUsers[checkChat.defaultRoom]
                )
            });

            /*
                Notify all users connected that new user has connected
             */
            Object.keys(checkChat.socketsToUsernames).forEach(function(socketId) {
                nsp.to(socketId).emit('user joined', { "username": username });
            })

        //} else if(checkChat.usersNew[username] === socket.id) {
        //    console.log("WHEN DOES THIS HAPPEN????????  **************** ????????????????????")
        } else {
            setTimeout(function() {
                nsp.to(socket.id).emit('error', { "userNameInUse" : true });
            }, 500);
        }
    });

    socket.on('change room', function(room) {
        if(!checkChat.roomHasFreeSpace(room)) {
            console.log('room has no free space');
            nsp.to(socket.id).emit('error', { message: "There is no space in " + room});
            return;
        }

        console.log('leaving ' + checkChat.socketsToRooms[socket.id] + ', entering ' + room);

        var username = checkChat.socketsToUsernames[socket.id];
        var oldRoom = checkChat.socketsToRooms[socket.id];

        socket.leave(checkChat.socketsToRooms[socket.id]);

        checkChat.socketsToRooms[socket.id] = room;
        checkChat.roomsToUsers[oldRoom] = _.without(checkChat.roomsToUsers[oldRoom], username);
        checkChat.roomsToUsers[room].push(username.toString());

        socket.join(room);
        nsp.to(room).emit('num of users changed', { numOfUsers: checkChat.countRoomMembers(room)});
    });

    socket.on('message', function(message) {
        nsp.to(checkChat.socketsToRooms[socket.id]).emit('message', {
            from: checkChat.socketsToUsernames[socket.id],
            message: message
        });
    });

});