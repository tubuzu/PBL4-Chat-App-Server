const http = require("http");
require('dotenv').config();
require('express-async-errors');
const socket = require("socket.io");
const WebSockets = require("./utils/WebSockets.js");
const webSockets = new WebSockets();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const groupRoutes = require("./routes/groupRoutes");
const messageRoutes = require("./routes/messageRoutes");
const groupMessageRoutes = require("./routes/groupMessageRoutes");
const friendRoutes = require("./routes/friendRoutes");
const friendRequestRoutes = require("./routes/friendRequestRoutes");
// const path = require("path");

//extra security packages
const helmet = require('helmet')
const cors = require('cors')
const xss = require('xss-clean')
const rateLimiter = require('express-rate-limit')
// var multer = require('multer');
// var upload = multer();
var upload = require('./utils/multer');

const express = require("express");
const app = express();

// connect db
connectDB();

// error handler
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// extra packages
app.use(rateLimiter({
  window: 15 * 60 * 1000,
  max: 100
}))
app.use(express.json());
app.use(helmet())
app.use(cors())
app.use(xss())

app.use(upload);
app.use(express.static('public'));

// routes
app.use("/api/user", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api", messageRoutes);
app.use("/api", groupMessageRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/friends/requests", friendRequestRoutes);

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;
const server = http.createServer(app);
server.listen(PORT);
server.on("listening", () => {
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
});

// const server = app.listen(
//   PORT,
//   console.log(`Server running on PORT ${PORT}...`.yellow.bold)
// );

global.io = socket(server, {
  pingTimeout: 60000,
  cors: {
    origin: ['https://bkzalo.onrender.com'],
    credentials: true,
  },
});

const events = require('events');
const eventEmitter = new events.EventEmitter();
global.eventEmitter = eventEmitter;

global.io.on("connection", webSockets.connection);