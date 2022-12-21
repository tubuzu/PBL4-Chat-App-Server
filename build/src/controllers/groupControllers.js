"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var asyncHandler = require("express-async-handler");
var Group = require("../models/groupModel");
var User = require("../models/userModel");
var socket = require("socket.io");
var _require = require('../errors'),
  BadRequestError = _require.BadRequestError,
  NotFoundError = _require.NotFoundError,
  UnauthenticatedError = _require.UnauthenticatedError;
var _require2 = require("http-status-codes"),
  StatusCodes = _require2.StatusCodes;
var WebSockets = require("../utils/WebSockets");

//@description     Get or Search all groups
//@route           GET /api/groups?search=
//@access          Protected
var searchGroup = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var keyword, groups;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            keyword = req.query.search ? {
              title: {
                $regex: req.query.search,
                $options: "i"
              }
            } : res.send([]);
            _context.next = 3;
            return Group.find(keyword).find({
              users: {
                $elemMatch: {
                  $eq: req.user._id
                }
              }
            }).populate({
              path: "users",
              select: "-password"
            }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage").sort({
              updatedAt: -1
            });
          case 3:
            groups = _context.sent;
            res.send(groups);
          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return function searchGroup(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

//@description     Create or fetch One to One Conversation
//@route           POST /api/conversation/
//@access          Protected
var createGroup = asyncHandler( /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(req, res) {
    var _req$body, users, title, groupData, createdGroup, FullGroup;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _req$body = req.body, users = _req$body.users, title = _req$body.title;
            if (users) {
              _context2.next = 4;
              break;
            }
            console.log("Users param not sent with request");
            throw new BadRequestError('Users param not sent with request');
          case 4:
            users.push(req.user._id.toString());
            groupData = {
              title: title,
              creator: req.user._id.toString(),
              owner: req.user._id.toString(),
              users: users
            };
            _context2.next = 8;
            return Group.create(groupData);
          case 8:
            createdGroup = _context2.sent;
            _context2.next = 11;
            return Group.findOne({
              _id: createdGroup._id
            }).populate({
              path: "users",
              select: "-password"
            }).populate("creator", "-password").populate("owner", "-password");
          case 11:
            FullGroup = _context2.sent;
            FullGroup.users.forEach(function (user) {
              var isUserOnline = WebSockets.onlineUsers.get(user._id.toString());
              isUserOnline && global.io.to(isUserOnline).emit('onGroupCreate', FullGroup);
            });
            res.status(StatusCodes.CREATED).json(FullGroup);
          case 14:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());

//@description     Fetch all Conversations for a user
//@route           GET /api/conversations/
//@access          Protected
var fetchGroups = asyncHandler( /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var groups;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return Group.find({
              users: {
                $elemMatch: {
                  $eq: req.user._id
                }
              }
            }).populate({
              path: "users",
              select: "-password"
            }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage").sort({
              updatedAt: -1
            });
          case 2:
            groups = _context3.sent;
            res.status(StatusCodes.OK).send(groups);
          case 4:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return function (_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}());

//@description     Fetch all Conversations for a user
//@route           GET /api/conversations/
//@access          Protected
var fetchGroupById = asyncHandler( /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(req, res) {
    var group;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return Group.findOne({
              $and: [{
                users: {
                  $elemMatch: {
                    $eq: req.user._id
                  }
                }
              }, {
                _id: req.params.id
              }]
            }).populate({
              path: "users",
              select: "-password"
            }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage");
          case 2:
            group = _context4.sent;
            if (!(group.length < 1)) {
              _context4.next = 5;
              break;
            }
            throw new NotFoundError("The user is not found or you are not in this group.");
          case 5:
            res.status(StatusCodes.OK).send(group);
          case 6:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return function (_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}());

//@description     Add new user to group
//@route           POST /api/groups/:groupId/recipients
//@access          Protected
var addGroupRecipients = asyncHandler( /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(req, res) {
    var groupId, recipients, group, groupResponse;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            groupId = req.params.groupId;
            recipients = req.body.recipients;
            _context5.next = 4;
            return Group.findOne({
              _id: groupId
            });
          case 4:
            group = _context5.sent;
            if (group._id) {
              _context5.next = 7;
              break;
            }
            throw new NotFoundError("Group not found!");
          case 7:
            // if (group.owner.toString() !== req.user._id.toString())
            //     throw new UnauthenticatedError("You are not authenticated to do this action!");

            recipients.map(function (user) {
              if (group.users.includes(user)) throw new BadRequestError("Recipient already in group!");
            });
            // const newMem = await User.findOne({ _id: userId });
            // if (!newMem._id) throw new NotFoundError("User not found!");
            // if (group.users.includes(newMem._id.toString())) throw new BadRequestError("Recipient already in group!");
            _context5.next = 10;
            return Group.findByIdAndUpdate(groupId, {
              $push: {
                users: {
                  $each: recipients
                }
              }
            }, {
              "new": true
            }).populate({
              path: "users",
              select: "-password"
            }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage");
          case 10:
            groupResponse = _context5.sent;
            // res.status(StatusCodes.OK).send({});

            global.io.to("group-".concat(groupId)).emit("onGroupReceivedNewUser", groupResponse);
            recipients.map(function (recipient) {
              var recipientSocket = WebSockets.onlineUsers.get(recipient);
              recipientSocket && global.io.to(recipientSocket).emit('onGroupUserAdd', groupResponse);
            });
            res.status(StatusCodes.OK).send(groupResponse);
          case 14:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return function (_x9, _x10) {
    return _ref5.apply(this, arguments);
  };
}());

//@description     Remove user from group
//@route           DELETE /api/groups/:groupId/recipients/:userId
//@access          Protected
var removeGroupRecipient = asyncHandler( /*#__PURE__*/function () {
  var _ref6 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(req, res) {
    var groupId, userId, group, groupResponse, room_name, recipientSocket;
    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            groupId = req.params.groupId;
            userId = req.params.userId;
            console.log('remove users');
            _context6.next = 5;
            return Group.findOne({
              _id: groupId
            });
          case 5:
            group = _context6.sent;
            if (group._id) {
              _context6.next = 8;
              break;
            }
            throw new NotFoundError("Group not found!");
          case 8:
            if (!(group.owner.toString() !== req.user._id.toString())) {
              _context6.next = 10;
              break;
            }
            throw new UnauthenticatedError("You are not authenticated to do this action!");
          case 10:
            if (group.users.includes(userId)) {
              _context6.next = 12;
              break;
            }
            throw new BadRequestError("Recipient is not a member of this group!");
          case 12:
            _context6.next = 14;
            return Group.findByIdAndUpdate(groupId, {
              $pull: {
                users: userId
              }
            }, {
              "new": true
            }).populate({
              path: "users",
              select: "-password"
            }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage");
          case 14:
            groupResponse = _context6.sent;
            // res.status(StatusCodes.OK).send({});
            room_name = "group-".concat(groupId);
            recipientSocket = WebSockets.onlineUsers.get(userId);
            global.io.to(room_name).emit("onGroupRecipientRemoved", groupResponse);
            if (recipientSocket) {
              global.io.to(recipientSocket).emit('onGroupRemoved', groupResponse);
              // console.log(global.io.sockets.adapter.rooms.get(room_name))
              // global.io.to(recipientSocket).leave(room_name);
            }

            res.status(StatusCodes.OK).send(groupResponse);
          case 20:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));
  return function (_x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}());

//@description     User leave group
//@route           DELETE /api/groups/:groupId/recipients/leave
//@access          Protected
var leaveGroup = asyncHandler( /*#__PURE__*/function () {
  var _ref7 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(req, res) {
    var groupId, userId, group, groupResponse, ROOM_NAME, socketsInRoom, leftUserSocket;
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            groupId = req.params.groupId;
            userId = req.user._id;
            console.log('leave group');
            _context7.next = 5;
            return Group.findOne({
              _id: groupId
            });
          case 5:
            group = _context7.sent;
            if (group._id) {
              _context7.next = 8;
              break;
            }
            throw new NotFoundError("Group not found!");
          case 8:
            if (group.users.includes(userId)) {
              _context7.next = 10;
              break;
            }
            throw new BadRequestError("Recipient is not a member of this group!");
          case 10:
            _context7.next = 12;
            return Group.findByIdAndUpdate(groupId, {
              $pull: {
                users: userId
              }
            }, {
              "new": true
            }).populate({
              path: "users",
              select: "-password"
            }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage");
          case 12:
            groupResponse = _context7.sent;
            // res.status(StatusCodes.OK).send({msg: 'You have left group!'});
            ROOM_NAME = "group-".concat(groupId);
            socketsInRoom = global.io.sockets.adapter.rooms.get(ROOM_NAME);
            leftUserSocket = WebSockets.onlineUsers.get(userId.toString());
            console.log(socketsInRoom, leftUserSocket, userId, WebSockets.onlineUsers);
            if (!(leftUserSocket && socketsInRoom)) {
              _context7.next = 28;
              break;
            }
            console.log('user is online, at least 1 person is in the room');
            if (!socketsInRoom.has(leftUserSocket)) {
              _context7.next = 24;
              break;
            }
            console.log('User is in room... room set has socket id');
            return _context7.abrupt("return", global.io.to(ROOM_NAME).emit('onGroupParticipantLeft', {
              userId: userId,
              group: groupResponse
            }));
          case 24:
            console.log('User is not in room, but someone is there');
            global.io.to(leftUserSocket).emit('onGroupParticipantLeft', {
              userId: userId,
              group: groupResponse
            });
            global.io.to(ROOM_NAME).emit('onGroupParticipantLeft', {
              userId: userId,
              group: groupResponse
            });
            return _context7.abrupt("return");
          case 28:
            if (!(leftUserSocket && !socketsInRoom)) {
              _context7.next = 31;
              break;
            }
            console.log('User is online but there are no sockets in the room');
            return _context7.abrupt("return", global.io.to(leftUserSocket).emit('onGroupParticipantLeft', {
              userId: userId,
              group: groupResponse
            }));
          case 31:
            res.status(StatusCodes.OK).send(groupResponse._id);
          case 32:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));
  return function (_x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}());

//@description     Update group owner
//@route           DELETE /api/groups/:groupId/owner
//@access          Protected
var updateGroupOwner = asyncHandler( /*#__PURE__*/function () {
  var _ref8 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(req, res) {
    var groupId, ownerId, group, groupResponse, ROOM_NAME, newOwnerSocket, newOwnerRooms;
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            groupId = req.params.groupId;
            ownerId = req.body.newOwnerId;
            console.log(groupId, ownerId);
            _context8.next = 5;
            return Group.findOne({
              _id: groupId
            });
          case 5:
            group = _context8.sent;
            if (group._id) {
              _context8.next = 8;
              break;
            }
            throw new NotFoundError("Group not found!");
          case 8:
            if (!(group.owner.toString() !== req.user._id.toString())) {
              _context8.next = 10;
              break;
            }
            throw new UnauthenticatedError("You are not authenticated to do this action!");
          case 10:
            if (group.users.includes(ownerId)) {
              _context8.next = 12;
              break;
            }
            throw new BadRequestError("Recipient is not a member of this group!");
          case 12:
            _context8.next = 14;
            return Group.findByIdAndUpdate(groupId, {
              owner: ownerId
            }, {
              "new": true
            }).populate({
              path: "users",
              select: "-password"
            }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage");
          case 14:
            groupResponse = _context8.sent;
            ROOM_NAME = "group-".concat(groupId);
            newOwnerSocket = WebSockets.onlineUsers.get(ownerId);
            newOwnerRooms = global.io.to(newOwnerSocket).rooms;
            console.log('Sockets In Room');
            console.log(newOwnerRooms);
            console.log(newOwnerSocket);
            global.io.to(ROOM_NAME).emit('onGroupOwnerUpdate', groupResponse);
            if (newOwnerSocket && !newOwnerRooms.has(ROOM_NAME)) {
              console.log('The new owner is not in the room...');
              global.io.to(newOwnerSocket).emit('onGroupOwnerUpdate', groupResponse);
            }
            res.status(StatusCodes.OK).send(groupResponse);
          case 24:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));
  return function (_x15, _x16) {
    return _ref8.apply(this, arguments);
  };
}());

//@description     Update group title
//@route           DELETE /api/groups/:groupId/title
//@access          Protected
var renameGroup = asyncHandler( /*#__PURE__*/function () {
  var _ref9 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(req, res) {
    var groupId, newTitle, group, groupResponse;
    return _regenerator["default"].wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            groupId = req.params.groupId;
            newTitle = req.body.newTitle;
            console.log(groupId, newTitle);
            _context9.next = 5;
            return Group.findOne({
              _id: groupId
            });
          case 5:
            group = _context9.sent;
            if (group._id) {
              _context9.next = 8;
              break;
            }
            throw new NotFoundError("Group not found!");
          case 8:
            if (!(group.owner.toString() !== req.user._id.toString())) {
              _context9.next = 10;
              break;
            }
            throw new UnauthenticatedError("You are not authenticated to do this action!");
          case 10:
            _context9.next = 12;
            return Group.findByIdAndUpdate(groupId, {
              title: newTitle
            }, {
              "new": true
            }).populate({
              path: "users",
              select: "-password"
            }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage");
          case 12:
            groupResponse = _context9.sent;
            // const ROOM_NAME = `group-${groupId}`;
            // const newOwnerSocket = WebSockets.onlineUsers.get(ownerId);
            // const newOwnerRooms = global.io.to(newOwnerSocket).rooms;
            // console.log('Sockets In Room');
            // console.log(newOwnerRooms);
            // console.log(newOwnerSocket);
            // global.io.to(ROOM_NAME).emit('onGroupOwnerUpdate', groupResponse);
            // if (newOwnerSocket && !newOwnerRooms.has(ROOM_NAME)) {
            //     console.log('The new owner is not in the room...');
            //     global.io.to(newOwnerSocket).emit('onGroupOwnerUpdate', groupResponse);
            // }

            res.status(StatusCodes.OK).send(groupResponse);
          case 14:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9);
  }));
  return function (_x17, _x18) {
    return _ref9.apply(this, arguments);
  };
}());
module.exports = {
  createGroup: createGroup,
  fetchGroups: fetchGroups,
  fetchGroupById: fetchGroupById,
  addGroupRecipients: addGroupRecipients,
  removeGroupRecipient: removeGroupRecipient,
  leaveGroup: leaveGroup,
  updateGroupOwner: updateGroupOwner,
  renameGroup: renameGroup,
  searchGroup: searchGroup
};