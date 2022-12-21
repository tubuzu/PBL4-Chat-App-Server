"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var asyncHandler = require("express-async-handler");
var _require = require("../errors"),
  NotFoundError = _require.NotFoundError,
  UnauthenticatedError = _require.UnauthenticatedError;
var Friend = require("../models/friendModel");
var WebSockets = require("../utils/WebSockets");

//@description     Get all friends by userId
//@route           GET /api/friends/
//@access          Protected
var fetchFriends = asyncHandler( /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var friends;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return Friend.find({
              $or: [{
                sender: {
                  $eq: req.user._id
                }
              }, {
                receiver: {
                  $eq: req.user._id
                }
              }]
            }).populate('sender', '-password').populate('receiver', '-password');
          case 2:
            friends = _context.sent;
            res.send(friends);
          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());

//@description     Delete friend
//@route           PATCH /api/friends/:friendId/delete
//@access          Protected
var removeFriend = asyncHandler( /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(req, res) {
    var friend, response, recipientSocket;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return Friend.findOne({
              _id: req.params.friendId
            });
          case 2:
            friend = _context2.sent;
            if (friend) {
              _context2.next = 5;
              break;
            }
            throw new NotFoundError("friendId not found!");
          case 5:
            if (!(friend.sender.toString() !== req.user._id.toString() && friend.receiver.toString() !== req.user._id.toString())) {
              _context2.next = 7;
              break;
            }
            throw new UnauthenticatedError("You are not authenticated to do this action!");
          case 7:
            _context2.next = 9;
            return Friend.findByIdAndDelete(req.params.friendId);
          case 9:
            response = _context2.sent;
            recipientSocket = WebSockets.onlineUsers.get(req.user._id.toString() === friend.sender.toString() ? friend.receiver.toString() : friend.sender.toString());
            if (recipientSocket) global.io.to(recipientSocket).emit('onFriendRemoved', friend);
            res.send(response);
          case 13:
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
module.exports = {
  fetchFriends: fetchFriends,
  removeFriend: removeFriend
};