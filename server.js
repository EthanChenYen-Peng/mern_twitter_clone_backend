const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const express = require('express');
const logger = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./utils/db');
const errorHandler = require('./middleware/errorHandler');
const userRouter = require('./routes/user.route');
const tweetRouter = require('./routes/tweet.route');
const Chat = require('./models/chat.model');

const app = express();
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.resolve(__dirname, 'config/dev.env') });
  app.use(logger('dev'));
}
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(cors());

// Mounting router
app.use('/v1/users', userRouter);
app.use('/v1/tweets', tweetRouter);

app.get('/', (req, res) => {
  res.json('Hello');
});

app.use(errorHandler);
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketIO(server, { origins: '*:*' });
io.on('connection', (socket) => {
  socket.on('join', async ({ name, room }, callback) => {
    socket.join(room);
    const chat = await Chat.findOne({ room });
    if (!chat) {
      await Chat.create({ room });
    } else {
      socket.emit('message', chat.history);
    }
    callback();
  });

  socket.on('sendMessage', async (data) => {
    const {
      content, createdBy, room, userName,
    } = data;
    let chat = await Chat.findOne({ room });
    chat.history.push({
      content,
      createdBy,
      userName,
    });
    chat = await chat.save();
    io.in(room).emit('message', { ...chat.history[chat.history.length - 1]._doc });
  });

  // socket.on('disconnect', () => {
  //   console.log('A user has left');
  // });
});

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

module.exports = { start, app };
