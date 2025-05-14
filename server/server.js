const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const emailService = require('./emailService');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./routes');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 25000
});

io.on('connection', (socket) => {
  socket.emit('connected', { message: 'You are connected to the WebSocket server' });
  socket.on('disconnect', () => {});
  socket.on('error', (error) => {});
});

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/todos';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {})
.catch(err => {});

app.use('/api', routes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {}); 