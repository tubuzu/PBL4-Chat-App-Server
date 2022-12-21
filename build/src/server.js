"use strict";

var http = require("http");
require('dotenv').config();
require('express-async-errors');
var socket = require("socket.io");
var WebSockets = require("./utils/WebSockets.js");
var webSockets = new WebSockets();
var connectDB = require("./config/db");
var userRoutes = require("./routes/userRoutes");
var conversationRoutes = require("./routes/conversationRoutes");
var groupRoutes = require("./routes/groupRoutes");
var messageRoutes = require("./routes/messageRoutes");
var groupMessageRoutes = require("./routes/groupMessageRoutes");
var friendRoutes = require("./routes/friendRoutes");
var friendRequestRoutes = require("./routes/friendRequestRoutes");
// const path = require("path");

//extra security packages
var helmet = require('helmet');
var cors = require('cors');
var xss = require('xss-clean');
var rateLimiter = require('express-rate-limit');
// var multer = require('multer');
// var upload = multer();
var upload = require('./utils/multer');
var express = require("express");
var app = express();

// connect db
connectDB();

// error handler
var _require = require("./middleware/errorMiddleware"),
  notFound = _require.notFound,
  errorHandler = _require.errorHandler;

// extra packages
app.use(rateLimiter({
  window: 15 * 60 * 1000,
  max: 100
}));
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());
app.use(upload);
app.use(express["static"]('public'));

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
var PORT = process.env.PORT;
var server = http.createServer(app);
server.listen(PORT);
server.on("listening", function () {
  console.log("Server running on PORT ".concat(PORT, "...").yellow.bold);
});

// const server = app.listen(
//   PORT,
//   console.log(`Server running on PORT ${PORT}...`.yellow.bold)
// );

global.io = socket(server, {
  pingTimeout: 60000
  // cors: {
  //   // origin: "http://localhost:*",
  //   origin: ['http://localhost:3000', 'http://localhost:19000', 'http://localhost:19001', 'http://dv-j53.tubuzu.app.exp.direct:80'],
  //   credentials: true,
  // },
});

var events = require('events');
var eventEmitter = new events.EventEmitter();
global.eventEmitter = eventEmitter;
global.io.on("connection", webSockets.connection);