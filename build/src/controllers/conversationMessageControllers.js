"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var asyncHandler = require("express-async-handler");
var Message = require("../models/messageModel");
var Conversation = require("../models/conversationModel");
var _require = require("../errors"),
  BadRequestError = _require.BadRequestError,
  NotFoundError = _require.NotFoundError;
var _require2 = require("http-status-codes"),
  StatusCodes = _require2.StatusCodes;
var WebSockets = require("../utils/WebSockets");
var cloudinary = require("../utils/cloudinary");

//@description     Get all Conversation Messages
//@route           GET /api/conversations/:conversationId/messages
//@access          Protected
var getMessagesByConversationId = asyncHandler( /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var conversation, _yield$Conversation$f, messages;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return Conversation.find({
              _id: req.params.conversationId
            });
          case 3:
            conversation = _context.sent;
            if (conversation[0]) {
              _context.next = 6;
              break;
            }
            throw new NotFoundError('Conversation is not found!');
          case 6:
            _context.next = 8;
            return Conversation.findOne({
              _id: conversation[0]._id
            }).populate({
              path: 'messages',
              populate: {
                path: 'sender',
                select: "_id avatar username firstname lastname email"
              },
              options: {
                sort: {
                  createdAt: -1
                }
              }
            });
          case 8:
            _yield$Conversation$f = _context.sent;
            messages = _yield$Conversation$f.messages;
            // .populate("conversation")

            res.json({
              _id: conversation[0]._id,
              messages: messages
            });
            _context.next = 17;
            break;
          case 13:
            _context.prev = 13;
            _context.t0 = _context["catch"](0);
            res.status(400);
            throw new Error(_context.t0.message);
          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 13]]);
  }));
  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
var sendConversationMessage = asyncHandler( /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var _req$body, content, id, conversationExist, attachments, message, conversation, messagePayload, recipient, recipientSocket;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _req$body = req.body, content = _req$body.content, id = _req$body.id;
            if (!(!content && !req.files.attachments || !id)) {
              _context3.next = 3;
              break;
            }
            throw new BadRequestError("Invalid data passed into request");
          case 3:
            conversationExist = Conversation.findOne({
              _id: id
            });
            if (conversationExist) {
              _context3.next = 6;
              break;
            }
            throw new NotFoundError('Conversation not found!');
          case 6:
            attachments = [];
            if (!req.files.attachments) {
              _context3.next = 11;
              break;
            }
            _context3.next = 10;
            return Promise.all(req.files.attachments.map( /*#__PURE__*/function () {
              var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(file) {
                var result;
                return _regenerator["default"].wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.next = 2;
                        return cloudinary.uploader.upload(file.path);
                      case 2:
                        result = _context2.sent;
                        console.log(result);
                        return _context2.abrupt("return", {
                          url: result.secure_url,
                          cloudId: result.public_id
                        });
                      case 5:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2);
              }));
              return function (_x5) {
                return _ref3.apply(this, arguments);
              };
            }()));
          case 10:
            attachments = _context3.sent;
          case 11:
            _context3.prev = 11;
            _context3.next = 14;
            return Message.create({
              sender: req.user._id,
              content: content,
              attachments: attachments,
              conversation: id
            });
          case 14:
            message = _context3.sent;
            _context3.next = 17;
            return Conversation.findByIdAndUpdate(id, {
              $push: {
                messages: message._id
              },
              latestMessage: message
            }, {
              "new": true,
              upsert: true
            }).populate("creator", "-password").populate("recipient", "-password").populate("latestMessage");
          case 17:
            conversation = _context3.sent;
            _context3.next = 20;
            return Message.findOne({
              _id: message._id
            }).populate("sender", "_id avatar username firstname lastname email");
          case 20:
            messagePayload = _context3.sent;
            recipient = conversation.creator._id.toString() === req.user._id.toString() ? conversation.recipient._id.toString() : conversation.creator._id.toString();
            recipientSocket = WebSockets.onlineUsers.get(recipient);
            if (recipientSocket) {
              global.io.to(recipientSocket).emit("onMessage", {
                message: messagePayload,
                conversation: conversation
              });
            }
            // eventEmitter.emit('message.create', conversation, messagePayload);
            global.io.to(WebSockets.onlineUsers.get(req.user._id.toString())).emit('onMessage', {
              message: messagePayload,
              conversation: conversation
            });
            console.log('send');
            res.status(StatusCodes.CREATED).json(messagePayload);
            _context3.next = 32;
            break;
          case 29:
            _context3.prev = 29;
            _context3.t0 = _context3["catch"](11);
            throw new BadRequestError(_context3.t0.message);
          case 32:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[11, 29]]);
  }));
  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());

//@description     Forward Message
//@route           POST /api/Message/forward
//@access          Protected
var forwardConversationMessage = asyncHandler( /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(req, res) {
    var messageBody, conversationId, message, conversation, messagePayload, recipient, recipientSocket;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            messageBody = req.body.messageBody;
            conversationId = req.params.conversationId;
            if (!(!messageBody.content && !messageBody.attachments.length || !conversationId)) {
              _context4.next = 4;
              break;
            }
            throw new BadRequestError("Invalid data passed into request");
          case 4:
            _context4.prev = 4;
            _context4.next = 7;
            return Message.create({
              sender: req.user._id,
              content: messageBody.content,
              attachments: messageBody.attachments,
              conversation: conversationId
            });
          case 7:
            message = _context4.sent;
            _context4.next = 10;
            return Conversation.findByIdAndUpdate(conversationId, {
              $push: {
                messages: message._id
              },
              latestMessage: message
            }, {
              "new": true,
              upsert: true
            }).populate("creator", "-password").populate("recipient", "-password").populate("latestMessage");
          case 10:
            conversation = _context4.sent;
            _context4.next = 13;
            return Message.findOne({
              _id: message._id
            }).populate("sender", "_id avatar username firstname lastname email");
          case 13:
            messagePayload = _context4.sent;
            recipient = conversation.creator._id.toString() === req.user._id.toString() ? conversation.recipient._id.toString() : conversation.creator._id.toString();
            recipientSocket = WebSockets.onlineUsers.get(recipient);
            if (recipientSocket) {
              global.io.to(recipientSocket).emit("onMessage", {
                message: messagePayload,
                conversation: conversation
              });
            }
            global.io.to(WebSockets.onlineUsers.get(req.user._id.toString())).emit('onMessage', {
              message: messagePayload,
              conversation: conversation
            });
            res.status(StatusCodes.CREATED).json(messagePayload);
            _context4.next = 24;
            break;
          case 21:
            _context4.prev = 21;
            _context4.t0 = _context4["catch"](4);
            throw new BadRequestError(_context4.t0.message);
          case 24:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, null, [[4, 21]]);
  }));
  return function (_x6, _x7) {
    return _ref4.apply(this, arguments);
  };
}());

//@description     Update message content
//@route           PATCH /api/conversations/:conversationId/messages/:messageId
//@access          Protected
var updateMessageById = asyncHandler( /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(req, res) {
    var _yield$Message$findOn, sender, message, _yield$Conversation$f2, recipient;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            _context5.next = 3;
            return Message.findOne({
              _id: req.params.messageId
            }).select('sender');
          case 3:
            _yield$Message$findOn = _context5.sent;
            sender = _yield$Message$findOn.sender;
            if (!(req.user._id.toString() !== sender.toString())) {
              _context5.next = 7;
              break;
            }
            throw new UnauthenticatedError('You are not authenticated to make changes of this message!');
          case 7:
            _context5.next = 9;
            return Message.findByIdAndUpdate(req.params.messageId, {
              content: req.body.content
            }, {
              "new": true
            }).populate("sender", "_id avatar username firstname lastname email").populate("conversation");
          case 9:
            message = _context5.sent;
            _context5.next = 12;
            return Conversation.findOne({
              _id: req.params.conversationId
            });
          case 12:
            _yield$Conversation$f2 = _context5.sent;
            recipient = _yield$Conversation$f2.recipient;
            if (recipient) {
              _context5.next = 16;
              break;
            }
            throw new NotFoundError('ConversationId not found!');
          case 16:
            WebSockets.onlineUsers.has(recipient.toString()) && global.io.to(WebSockets.onlineUsers.get(recipient.toString())).emit("onMessageUpdate", message);
            res.json(message);
            _context5.next = 24;
            break;
          case 20:
            _context5.prev = 20;
            _context5.t0 = _context5["catch"](0);
            res.status(400);
            throw new Error(_context5.t0.message);
          case 24:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[0, 20]]);
  }));
  return function (_x8, _x9) {
    return _ref5.apply(this, arguments);
  };
}());

//@description     Update message content
//@route           PATCH /api/conversations/:conversationId/messages/:messageId
//@access          Protected
var deleteMessageById = asyncHandler( /*#__PURE__*/function () {
  var _ref6 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(req, res) {
    var _yield$Message$findOn2, sender, message, _yield$Conversation$f3, messages, latestMessage, _yield$Conversation$f4, _id, recipient;
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            _context7.next = 3;
            return Message.findOne({
              _id: req.params.messageId
            }).select('sender');
          case 3:
            _yield$Message$findOn2 = _context7.sent;
            sender = _yield$Message$findOn2.sender;
            if (!(req.user._id.toString() !== sender.toString())) {
              _context7.next = 7;
              break;
            }
            throw new UnauthenticatedError('You are not authenticated to make changes of this message!');
          case 7:
            _context7.next = 9;
            return Message.findByIdAndDelete(req.params.messageId);
          case 9:
            message = _context7.sent;
            _context7.next = 12;
            return Conversation.findOneAndUpdate({
              _id: req.params.conversationId
            }, {
              $pull: {
                messages: req.params.messageId
              }
            });
          case 12:
            message.attachments.length && message.attachments.map( /*#__PURE__*/function () {
              var _ref7 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(file) {
                return _regenerator["default"].wrap(function _callee6$(_context6) {
                  while (1) {
                    switch (_context6.prev = _context6.next) {
                      case 0:
                        _context6.next = 2;
                        return cloudinary.uploader.destroy(file.cloudId);
                      case 2:
                      case "end":
                        return _context6.stop();
                    }
                  }
                }, _callee6);
              }));
              return function (_x12) {
                return _ref7.apply(this, arguments);
              };
            }());
            _context7.next = 15;
            return Conversation.findOne({
              _id: req.params.conversationId
            }).select('messages latestMessage');
          case 15:
            _yield$Conversation$f3 = _context7.sent;
            messages = _yield$Conversation$f3.messages;
            latestMessage = _yield$Conversation$f3.latestMessage;
            if (!(latestMessage.toString() === message._id.toString())) {
              _context7.next = 21;
              break;
            }
            _context7.next = 21;
            return Conversation.findOneAndUpdate({
              _id: req.params.conversationId
            }, {
              latestMessage: messages[messages.length - 1]
            });
          case 21:
            _context7.next = 23;
            return Conversation.findOne({
              _id: req.params.conversationId
            });
          case 23:
            _yield$Conversation$f4 = _context7.sent;
            _id = _yield$Conversation$f4._id;
            recipient = _yield$Conversation$f4.recipient;
            WebSockets.onlineUsers.has(recipient.toString()) && global.io.to(WebSockets.onlineUsers.get(recipient.toString())).emit("onMessageDelete", {
              conversationId: req.params.conversationId,
              messageId: message._id
            });
            res.json({
              conversationId: _id,
              messageId: message._id
            });
            _context7.next = 34;
            break;
          case 30:
            _context7.prev = 30;
            _context7.t0 = _context7["catch"](0);
            res.status(400);
            throw new Error(_context7.t0.message);
          case 34:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, null, [[0, 30]]);
  }));
  return function (_x10, _x11) {
    return _ref6.apply(this, arguments);
  };
}());
module.exports = {
  getMessagesByConversationId: getMessagesByConversationId,
  sendConversationMessage: sendConversationMessage,
  forwardConversationMessage: forwardConversationMessage,
  updateMessageById: updateMessageById,
  deleteMessageById: deleteMessageById
};