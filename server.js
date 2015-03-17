var express = require('express');
var app = express().use(express.static(__dirname + '/'));
var http = require('http').Server(app);
var io = require('socket.io')(http);

if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
        for(var i=0; i < this.length; i++){
            if(this[i]==obj){
                return i;
            }
        }
        return -1;
    };
}

Array.prototype.remove = function(value) {
    if (this.indexOf(value)!==-1) {
        this.splice(this.indexOf(value), 1);
        return true;
    } else {
        return false;
    };
}


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
    test: function() {

    }
};

nsp.on('connection', function(socket){

    socket.on('disconnect', function() {
        console.log(checkChat);
        var username = checkChat.socketsToUsernames[socket.id];
        var room = checkChat.socketsToRooms[socket.id];

        // Todo : remove user from room
        //console.log(room);
        //console.log(checkChat.roomsToUsers[room]);
        checkChat.roomsToUsers[room].remove(username);

        delete checkChat.socketsToUsernames[socket.id];
        delete checkChat.usernamesToSockets[username];
        delete checkChat.socketsToRooms[socket.id];

        nsp.to(room).emit('user disconnected', { username: username});
    });

    socket.on('set username', function(username) {
        if(username === undefined) {
            setTimeout(function() {
                nsp.to(socket.id).emit('error', { "userNameInUse" : true });
            }, 500);
            return;
        }
        if(!checkChat.usernameExist(username)) {
            /*
                Saving user data.
                With this data we can manipulate with users name, socket id and room
             */
            checkChat.usernamesToSockets[username] = socket.id;
            checkChat.socketsToUsernames[socket.id] = username;
            console.log(username);
            console.log(checkChat.defaultRoom);
            console.log(typeof checkChat.roomsToUsers['public_room'].constructor);
            var testar = [];
            testar.push('opala');
            console.log(testar);
            checkChat.roomsToUsers[checkChat.defaultRoom].push(username.toString());
            console.log('ROOMS TO USERS ARRAY: ');
            console.log(checkChat.roomsToUsers[checkChat.defaultRoom]);
            checkChat.socketsToRooms[socket.id] = checkChat.defaultRoom;

            /*
                Connect user to single room
             */
            socket.join(checkChat.defaultRoom);

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
        console.log('leaving ' + checkChat.socketsToRooms[socket.id] + ', entering ' + room);
        socket.leave(checkChat.socketsToRooms[socket.id]);
        checkChat.socketsToRooms[socket.id] = room;
        socket.join(room);
    });

    socket.on('message', function(message) {
        nsp.to(checkChat.socketsToRooms[socket.id]).emit('message', {
            from: checkChat.socketsToUsernames[socket.id],
            message: message
        });
    });

});