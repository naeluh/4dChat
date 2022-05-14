const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const session = require('express-session');

const app = express();
const httpServer = createServer(app);

const sessionMiddleware = session({
  secret: 'changeit',
  resave: false,
  saveUninitialized: false
});

app.use(sessionMiddleware);

app.post('/login', (req, res) => {
  req.session.authenticated = true;
  res.status(204).end();
});

const io = new Server(httpServer);

// convert a connect middleware to a Socket.IO middleware
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

// only allow authenticated users
io.use((socket, next) => {
  const session = socket.request.session;
  if (session && session.authenticated) {
    next();
  } else {
    next(new Error('unauthorized'));
  }
});

io.on('connection', (socket) => {
  console.log(socket.request.session);
});
