var express = require('express');
var app = express();
var multer = require('multer');
var multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'static');
    },
    filename: function (req, file, cb) {
        var ext = file.mimetype.split('/')[1];
        cb(null, "files/4dchat-".concat(file.fieldname, "-").concat(Date.now(), ".dae"));
    },
});
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 6969;
var upload = multer({ storage: multerStorage });
http.listen(port, function () {
    console.log("Socket.IO server running at http://localhost:".concat(port, "/"));
});
app.use(cookieParser());
app.use(cookieSession({
    secret: 'somesekrettoken',
}));
app.use(express.static(__dirname + '/static'));
app.get('/', function (req, res) {
    res.render('index.ejs', {
        email: req.session.email || null,
    });
});
app.get('/test', function (req, res) {
    res.render('test.ejs', {
        email: req.session.email || null,
    });
});
var usernames = {};
var rooms = {};
var roomFileArr = {};
var userColor = {};
var value = 0;
var imgName;
app.get('/:room', function (req, res, next) {
    if (rooms[req.params.room]) {
        console.log('Sent');
        res.render('room.ejs', {
            email: req.session.email || null,
        });
    }
    else {
        console.log('Redirected');
        res.redirect('/');
    }
});
app.get('/file/:room', function (req, res, next) {
    if (roomFileArr[req.params.room]) {
        console.log(roomFileArr[req.params.room]);
        var fileToSend = roomFileArr[req.params.room];
        res.send(fileToSend);
    }
    else {
        console.log('NotFound');
        res.send(404);
    }
});
app.post('/api', upload.array('files'), function (req, res, next) {
    res.json({ file: req.files });
});
function uploadFiles(req, res) {
    console.log(req.body);
    console.log(req.files);
    console.log(req.files || {});
    console.log('Image Path ' + imgName || {});
    res.send(imgName);
    return res.send(200);
}
io.on('connection', function (socket) {
    socket.on('adduser', function (username, color, room) {
        console.log(username, color, room);
        if (username === undefined || username === null || username === '') {
            username = 'fake user #' + value++;
            socket.username = username;
            usernames[username] = username;
            userColor[username] = color;
        }
        else {
            socket.username = username;
            usernames[username] = username;
            userColor[username] = color;
        }
        io.in(socket.room).emit('updatechat', 'SERVER', '#fff', socket.username + ' has joined this room');
    });
    socket.on('addroom', function (room) {
        socket.join(room);
        console.log('Room ' + room || {});
        socket.emit('updatechat', 'SERVER', '#fff', 'you have connected to ' + room);
        socket.rooms = room;
        rooms[room] = room;
        console.log('new user ' + socket.username || {});
        io.in(socket.room).emit('updatechat', 'SERVER', '#fff', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, room);
    });
    socket.on('update_coords', function (pos) {
        var x, _ref;
        var mouseColor = '#fff';
        try {
            if (userColor[socket.username]) {
                var mouseColor_1 = userColor[socket.username];
                console.log('Client: ' + socket.id);
                console.log('X: ' + pos.x + ',  Y: ' + pos.y);
            }
        }
        catch (err) {
            console.log(err);
        }
        return io.emit('send_data', pos, socket.username, mouseColor);
    });
    socket.on('sendchat', function (data) {
        console.log(data);
        //console.log(socket);
        if (userColor[socket.username]) {
            var colors = userColor[socket.username];
            io.in(socket.room).emit('updatechat', socket.username, colors, data);
        }
        else {
            var colors = '#fff';
            io.in(socket.room).emit('updatechat', socket.username, colors, data);
        }
    });
    socket.on('switchRoom', function (newroom) {
        socket.leave(socket.room);
        socket.join(newroom);
        console.log('newroom ' + newroom || {});
        socket.emit('updatechat', 'SERVER', '#fff', 'you have connected to ' + newroom);
        socket.broadcast
            .to(socket.room)
            .emit('updatechat', 'SERVER', '#fff', socket.username + ' has left this room');
        socket.room = newroom;
        rooms[newroom] = newroom;
        io.in(socket.room).emit('updatechat', 'SERVER', '#fff', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, newroom);
    });
    socket.on('disconnect', function () {
        socket.broadcast.emit('updatechat', 'SERVER', '#fff', socket.username + ' has disconnected');
        delete usernames[socket.username];
        io.emit('updateusers', usernames);
        socket.leave(socket.room);
    });
    socket.on('draw', function (dataControls) {
        io.in(socket.room).emit('updateControls', socket.username, socket.room, dataControls);
    });
    socket.on('updateFile', function (newFile, userRoom) {
        console.log(newFile || {});
        console.log(userRoom || {});
        console.log(roomFileArr || {});
        io.in(socket.room).emit('addFile', socket.username, userRoom, newFile);
        roomFileArr[userRoom] = newFile;
        console.log(roomFileArr || {});
    });
    socket.on('session', function (whichSession) {
        io.in(socket.room).emit('checkSession', whichSession);
    });
});
//# sourceMappingURL=server.js.map