const multer = require('multer');
const app = require('express')();
const http = require('http').Server(app);
// const https = require('https');
const io = require('socket.io')(http);

server.listen(6969);

app.use(express.cookieParser());
app.use(
  express.cookieSession({
    secret: 'stupid'
  })
);

app.use(express.static(__dirname + '/static'));

app.get('/', function (req, res) {
  res.render('index.ejs', {
    email: req.session.email || null
  });
});

app.get('/test', function (req, res) {
  res.render('test.ejs', {
    email: req.session.email || null
  });
});

const usernames = {};
const rooms = {};
const roomFileArr = {};
const userColor = {};
let value = isNaN(value) ? 0 : value;
let imgName;

app.get('/:room', function (req, res, next) {
  if (rooms[req.params.room]) {
    console.log('Sent');
    res.render('room.ejs', {
      email: req.session.email || null
    });
  } else {
    console.log('Redirected');
    res.redirect('/');
  }
});

app.get('/file/:room', function (req, res, next) {
  if (roomFileArr[req.params.room]) {
    console.log(roomFileArr[req.params.room]);
    const fileToSend = roomFileArr[req.params.room];
    res.send(fileToSend);
  } else {
    console.log('NotFound');
    res.send(404);
  }
});

app.post(
  '/api',
  multer({
    dest: './static/files/',
    rename: function (fieldname, filename) {
      return filename + Date.now();
    },
    onFileUploadStart: function (file) {
      console.log(file.originalname + ' is starting ...');
    },
    onFileUploadComplete: function (file) {
      console.log(file.fieldname + ' uploaded to  ' + file.path);
      imgName = file.name;
    },
    onError: function (err, next) {
      console.log(err);
      next(err);
    }
  }),
  function (req, res) {
    console.log(req.files || {});
    console.log('Image Path ' + imgName || {});
    res.send(imgName);
    return res.send(200);
  }
);

io.on('connection', function (socket) {
  socket.on('adduser', function (username, color) {
    if (username === undefined || username === null || username === '') {
      username = 'fake user #' + value++;
      socket.username = username;
      usernames[username] = username;
      userColor[username] = color;
    } else {
      socket.username = username;
      usernames[username] = username;
      userColor[username] = color;
    }
  });

  socket.on('addroom', function (room) {
    socket.join(room);
    console.log('Room ' + room || {});
    socket.emit(
      'updatechat',
      'SERVER',
      '#fff',
      'you have connected to ' + room
    );
    socket.rooms = room;
    rooms[room] = room;
    console.log('new user ' + socket.username || {});
    io.in(socket.room).emit(
      'updatechat',
      'SERVER',
      '#fff',
      socket.username + ' has joined this room'
    );
    socket.emit('updaterooms', rooms, room);
  });

  socket.on('update_coords', function (pos) {
    let x, _ref;
    var mouseColor = '#fff';
    try {
      if (userColor[socket.username]) {
        let mouseColor = userColor[socket.username];
        console.log('Client: ' + socket.id);
        console.log('X: ' + pos.x + ',  Y: ' + pos.y);
      }
    } catch (err) {
      console.log(err);
    }
    return io.emit('send_data', pos, socket.username, mouseColor);
  });

  socket.on('sendchat', function (data) {
    console.log('new user ' + socket.username || {});
    if (userColor[socket.username]) {
      var colors = userColor[socket.username];
      io.in(socket.room).emit('updatechat', socket.username, colors, data);
    } else {
      var colors = '#fff';
      io.in(socket.room).emit('updatechat', socket.username, colors, data);
    }
  });

  socket.on('switchRoom', function (newroom) {
    socket.leave(socket.room);
    socket.join(newroom);
    console.log('newroom ' + newroom || {});
    socket.emit(
      'updatechat',
      'SERVER',
      '#fff',
      'you have connected to ' + newroom
    );
    socket.broadcast
      .to(socket.room)
      .emit(
        'updatechat',
        'SERVER',
        '#fff',
        socket.username + ' has left this room'
      );
    socket.room = newroom;
    rooms[newroom] = newroom;
    io.in(socket.room).emit(
      'updatechat',
      'SERVER',
      '#fff',
      socket.username + ' has joined this room'
    );
    socket.emit('updaterooms', rooms, newroom);
  });

  socket.on('disconnect', function () {
    socket.broadcast.emit(
      'updatechat',
      'SERVER',
      '#fff',
      socket.username + ' has disconnected'
    );
    delete usernames[socket.username];
    io.emit('updateusers', usernames);
    socket.leave(socket.room);
  });

  socket.on('draw', function (dataControls) {
    io.in(socket.room).emit(
      'updateControls',
      socket.username,
      socket.room,
      dataControls
    );
  });

  socket.on('updateFile', function (newFile, userRoom) {
    console.log(newFile || {});
    console.log(userRoom || {});
    console.log(roomFileArr || {});
    io.in(socket.room).emit('addFile', socket.username, userRoom, newFile);
    roomFileArr[userRoom] = imgName;
    console.log(roomFileArr || {});
  });

  socket.on('session', function (whichSession) {
    io.in(socket.room).emit('checkSession', whichSession);
  });
});
