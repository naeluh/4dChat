const express = require('express');
const app = express();
const multer = require('multer');
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'static');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `files/4dchat-${file.fieldname}-${Date.now()}.dae`);
  },
});
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 6969;
const upload = multer({ storage: multerStorage });

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});

app.use(cookieParser());
app.use(
  cookieSession({
    secret: 'somesekrettoken',
  })
);

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

const usernames = {};
const rooms = {};
const roomFileArr = {};
const userColor = {};
let value = 0;
let imgName;

app.get('/:room', (req, res, next) => {
  if (rooms[req.params.room]) {
    console.log('Sent');
    res.render('room.ejs', {
      email: req.session.email || null,
    });
  } else {
    console.log('Redirected');
    res.redirect('/');
  }
});

app.get('/file/:room', (req, res, next) => {
  if (roomFileArr[req.params.room]) {
    console.log(roomFileArr[req.params.room]);
    const fileToSend = roomFileArr[req.params.room];
    res.send(fileToSend);
  } else {
    console.log('NotFound');
    res.send(404);
  }
});

app.post('/api', upload.array('files'), (req, res, next) => {
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

io.on('connection', socket => {
  socket.on('adduser', (username, color, room) => {
    console.log(username, color, room);
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
    io.in(socket.room).emit(
      'updatechat',
      'SERVER',
      '#fff',
      socket.username + ' has joined this room'
    );
  });

  socket.on('addroom', room => {
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

  socket.on('update_coords', pos => {
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

  socket.on('sendchat', data => {
    console.log(data);
    //console.log(socket);
    if (userColor[socket.username]) {
      var colors = userColor[socket.username];
      io.in(socket.room).emit('updatechat', socket.username, colors, data);
    } else {
      var colors = '#fff';
      io.in(socket.room).emit('updatechat', socket.username, colors, data);
    }
  });

  socket.on('switchRoom', newroom => {
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

  socket.on('disconnect', () => {
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

  socket.on('draw', dataControls => {
    io.in(socket.room).emit(
      'updateControls',
      socket.username,
      socket.room,
      dataControls
    );
  });

  socket.on('updateFile', (newFile, userRoom) => {
    console.log(newFile || {});
    console.log(userRoom || {});
    console.log(roomFileArr || {});
    io.in(socket.room).emit('addFile', socket.username, userRoom, newFile);
    roomFileArr[userRoom] = newFile;
    console.log(roomFileArr || {});
  });

  socket.on('session', whichSession => {
    io.in(socket.room).emit('checkSession', whichSession);
  });
});
