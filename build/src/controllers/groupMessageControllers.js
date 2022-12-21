"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var asyncHandler = require("express-async-handler");
var GroupMessage = require("../models/groupMessageModel");
// const User = require("../models/userModel");
var Group = require("../models/groupModel");
var _require = require("../errors"),
  BadRequestError = _require.BadRequestError,
  UnauthenticatedError = _require.UnauthenticatedError,
  NotFoundError = _require.NotFoundError;
var _require2 = require("http-status-codes"),
  StatusCodes = _require2.StatusCodes;
var WebSockets = require("../utils/WebSockets");
var cloudinary = require("../utils/cloudinary");

//@description     Get all Group Messages
//@route           GET /api/group/:groupId/messages
//@access          Protected
var getMessagesByGroupId = asyncHandler( /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var group, _yield$Group$findOne$, messages;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return Group.find({
              _id: req.params.groupId
            });
          case 3:
            group = _context.sent;
            if (group[0]) {
              _context.next = 6;
              break;
            }
            throw new NotFoundError('Conversation is not found!');
          case 6:
            _context.next = 8;
            return Group.findOne({
              _id: group[0]._id
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
            _yield$Group$findOne$ = _context.sent;
            messages = _yield$Group$findOne$.messages;
            // .populate("group");

            res.json({
              _id: group[0]._id,
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
var sendGroupMessage = asyncHandler( /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var _req$body, content, id, groupExist, attachments, message, group, messagePayload;
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
            groupExist = Group.findOne({
              _id: id
            });
            if (groupExist) {
              _context3.next = 6;
              break;
            }
            throw new NotFoundError('Group not found!');
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
            return GroupMessage.create({
              sender: req.user._id,
              content: content,
              attachments: attachments,
              group: id
            });
          case 14:
            message = _context3.sent;
            _context3.next = 17;
            return Group.findByIdAndUpdate(id, {
              $push: {
                messages: message._id
              },
              latestMessage: message
            }, {
              "new": true
            }).populate({
              path: "users",
              select: "-password"
            }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage");
          case 17:
            group = _context3.sent;
            _context3.next = 20;
            return GroupMessage.findOne({
              _id: message._id
            }).populate("sender", "_id avatar username firstname lastname email");
          case 20:
            messagePayload = _context3.sent;
            global.io.to("group-".concat(group._id)).emit('onGroupMessage', {
              message: messagePayload,
              group: group
            });
            res.status(StatusCodes.CREATED).json(messagePayload);
            _context3.next = 28;
            break;
          case 25:
            _context3.prev = 25;
            _context3.t0 = _context3["catch"](11);
            throw new BadRequestError(_context3.t0.message);
          case 28:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[11, 25]]);
  }));
  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());

//@description     Forward Message
//@route           POST /api/Message/forward
//@access          Protected
var forwardGroupMessage = asyncHandler( /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(req, res) {
    var messageBody, groupId, message, group, messagePayload;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            messageBody = req.body.messageBody;
            groupId = req.params.groupId;
            if (!(!messageBody.content && !messageBody.attachments.length || !groupId)) {
              _context4.next = 4;
              break;
            }
            throw new BadRequestError("Invalid data passed into request");
          case 4:
            _context4.prev = 4;
            _context4.next = 7;
            return GroupMessage.create({
              sender: req.user._id,
              content: messageBody.content,
              attachments: messageBody.attachments,
              group: groupId
            });
          case 7:
            message = _context4.sent;
            _context4.next = 10;
            return Group.findByIdAndUpdate(groupId, {
              $push: {
                messages: message._id
              },
              latestMessage: message
            }, {
              "new": true
            }).populate({
              path: "users",
              select: "-password"
            }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage");
          case 10:
            group = _context4.sent;
            _context4.next = 13;
            return GroupMessage.findOne({
              _id: message._id
            }).populate("sender", "_id avatar username firstname lastname email");
          case 13:
            messagePayload = _context4.sent;
            global.io.to("group-".concat(group._id)).emit('onGroupMessage', {
              message: messagePayload,
              group: group
            });
            res.status(StatusCodes.CREATED).json(messagePayload);
            _context4.next = 21;
            break;
          case 18:
            _context4.prev = 18;
            _context4.t0 = _context4["catch"](4);
            throw new BadRequestError(_context4.t0.message);
          case 21:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, null, [[4, 18]]);
  }));
  return function (_x6, _x7) {
    return _ref4.apply(this, arguments);
  };
}());

//@description     Update message content
//@route           PATCH /api/group/:groupId/messages/:messageId
//@access          Protected
var updateGroupMessageById = asyncHandler( /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(req, res) {
    var _yield$GroupMessage$f, sender, message, _yield$Group$findOne, users;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            _context5.next = 3;
            return GroupMessage.findOne({
              _id: req.params.messageId
            }).select('sender');
          case 3:
            _yield$GroupMessage$f = _context5.sent;
            sender = _yield$GroupMessage$f.sender;
            if (!(req.user._id.toString() !== sender.toString())) {
              _context5.next = 7;
              break;
            }
            throw new UnauthenticatedError('You are not authenticated to make changes of this message!');
          case 7:
            _context5.next = 9;
            return GroupMessage.findByIdAndUpdate(req.params.messageId, {
              content: req.body.content
            }, {
              "new": true
            }).populate("sender", "_id avatar username firstname lastname email").populate("group");
          case 9:
            message = _context5.sent;
            _context5.next = 12;
            return Group.findOne({
              _id: req.params.groupId
            });
          case 12:
            _yield$Group$findOne = _context5.sent;
            users = _yield$Group$findOne.users;
            if (users) {
              _context5.next = 16;
              break;
            }
            throw new NotFoundError('GroupId not found!');
          case 16:
            users.map(function (user) {
              if (user.toString() !== message.sender._id.toString() && WebSockets.onlineUsers.has(user.toString())) global.io.to(WebSockets.onlineUsers.get(user.toString())).emit("onGroupMessageUpdate", message);
            });
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
//@route           PATCH /api/groups/:groupId/messages/:messageId
//@access          Protected
var deleteGroupMessageById = asyncHandler( /*#__PURE__*/function () {
  var _ref6 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(req, res) {
    var _yield$GroupMessage$f2, sender, message, _yield$Group$findOne$2, messages, latestMessage, _yield$Group$findOne2, _id, users;
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            _context7.next = 3;
            return GroupMessage.findOne({
              _id: req.params.messageId
            }).select('sender');
          case 3:
            _yield$GroupMessage$f2 = _context7.sent;
            sender = _yield$GroupMessage$f2.sender;
            if (!(req.user._id.toString() !== sender.toString())) {
              _context7.next = 7;
              break;
            }
            throw new UnauthenticatedError('You are not authenticated to make changes of this message!');
          case 7:
            _context7.next = 9;
            return GroupMessage.findByIdAndDelete(req.params.messageId);
          case 9:
            message = _context7.sent;
            _context7.next = 12;
            return Group.findOneAndUpdate({
              _id: req.params.groupId
            }, {
              $pull: {
                messages: req.params.messageId
              }
            });
          case 12:
            _context7.next = 14;
            return Group.findOne({
              _id: req.params.groupId
            }).select('messages latestMessage');
          case 14:
            _yield$Group$findOne$2 = _context7.sent;
            messages = _yield$Group$findOne$2.messages;
            latestMessage = _yield$Group$findOne$2.latestMessage;
            if (!(latestMessage.toString() === message._id.toString())) {
              _context7.next = 20;
              break;
            }
            _context7.next = 20;
            return Group.findOneAndUpdate({
              _id: req.params.groupId
            }, {
              latestMessage: messages[messages.length - 1]
            });
          case 20:
            _context7.next = 22;
            return Group.findOne({
              _id: req.params.groupId
            });
          case 22:
            _yield$Group$findOne2 = _context7.sent;
            _id = _yield$Group$findOne2._id;
            users = _yield$Group$findOne2.users;
            users.map(function (user) {
              if (user.toString() !== message.sender.toString() && WebSockets.onlineUsers.has(user.toString())) global.io.to(WebSockets.onlineUsers.get(user.toString())).emit("onGroupMessageDelete", {
                groupId: _id,
                messageId: message._id
              });
            });
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
            res.json({
              groupId: req.params.groupId,
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
  getMessagesByGroupId: getMessagesByGroupId,
  sendGroupMessage: sendGroupMessage,
  forwardGroupMessage: forwardGroupMessage,
  updateGroupMessageById: updateGroupMessageById,
  deleteGroupMessageById: deleteGroupMessageById
};