"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var asyncHandler = require("express-async-handler");
var _require = require("../errors"),
  NotFoundError = _require.NotFoundError,
  UnauthenticatedError = _require.UnauthenticatedError,
  BadRequestError = _require.BadRequestError;
var Friend = require("../models/friendModel");
var FriendRequest = require("../models/friendRequest");
var User = require("../models/userModel");

//@description     Get all requests by userId
//@route           GET /api/friends/requests/
//@access          Protected
var fetchRequests = asyncHandler( /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var requests;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return FriendRequest.find({
              $or: [{
                sender: {
                  $eq: req.user._id
                }
              }, {
                receiver: {
                  $eq: req.user._id
                }
              }],
              status: 'pending'
            }).populate('sender', '-password').populate('receiver', '-password');
          case 3:
            requests = _context.sent;
            res.send(requests);
            _context.next = 11;
            break;
          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](0);
            res.status(400);
            throw new Error(_context.t0.message);
          case 11:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 7]]);
  }));
  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());

//@description     Create request
//@route           POST /api/friends/requests/:requestId/create
//@access          Protected
var createRequest = asyncHandler( /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(req, res) {
    var senderId, receiverId, receiver, friendRequestExist, friendExist, friendRequest;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            senderId = req.user._id;
            receiverId = req.body.friendId;
            if (!(senderId.toString() === receiverId)) {
              _context2.next = 4;
              break;
            }
            throw new BadRequestError("Cannot add yourself!");
          case 4:
            _context2.next = 6;
            return User.findOne({
              _id: receiverId
            });
          case 6:
            receiver = _context2.sent;
            if (receiver) {
              _context2.next = 9;
              break;
            }
            throw new NotFoundError("Receiver does not exist!");
          case 9:
            _context2.next = 11;
            return FriendRequest.find({
              $or: [{
                sender: {
                  $eq: senderId
                },
                receiver: {
                  $eq: receiverId
                },
                status: 'pending'
              }, {
                sender: {
                  $eq: receiverId
                },
                receiver: {
                  $eq: senderId
                },
                status: 'pending'
              }]
            });
          case 11:
            friendRequestExist = _context2.sent;
            if (!friendRequestExist.length) {
              _context2.next = 14;
              break;
            }
            throw new BadRequestError("Friend request is pending!");
          case 14:
            _context2.next = 16;
            return Friend.find({
              $or: [{
                sender: {
                  $eq: senderId
                },
                receiver: {
                  $eq: receiverId
                }
              }, {
                sender: {
                  $eq: receiverId
                },
                receiver: {
                  $eq: senderId
                }
              }]
            });
          case 16:
            friendExist = _context2.sent;
            if (!friendExist.length) {
              _context2.next = 19;
              break;
            }
            throw new BadRequestError("Friend already existed!");
          case 19:
            _context2.next = 21;
            return FriendRequest.create({
              sender: senderId,
              receiver: receiverId
            });
          case 21:
            friendRequest = _context2.sent;
            res.send(friendRequest);
          case 23:
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

//@description     Delete friend
//@route           PATCH /api/friends/requests/:requestId/accept
//@access          Protected
var acceptRequest = asyncHandler( /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var requestId, friendRequest, requestUpdated, friend;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            requestId = req.params.requestId;
            _context3.next = 4;
            return FriendRequest.findOne({
              _id: requestId
            });
          case 4:
            friendRequest = _context3.sent;
            if (friendRequest) {
              _context3.next = 7;
              break;
            }
            throw new NotFoundError("Request not found!");
          case 7:
            if (!(friendRequest.status === 'accepted')) {
              _context3.next = 9;
              break;
            }
            throw new BadRequestError("Request already accepted!");
          case 9:
            if (!(friendRequest.status === 'rejected')) {
              _context3.next = 11;
              break;
            }
            throw new BadRequestError("Request had been rejected!");
          case 11:
            _context3.next = 13;
            return FriendRequest.findByIdAndUpdate(requestId, {
              status: 'accepted'
            }, {
              "new": true,
              upsert: true
            });
          case 13:
            requestUpdated = _context3.sent;
            _context3.next = 16;
            return Friend.create({
              sender: requestUpdated.sender,
              receiver: requestUpdated.receiver
            });
          case 16:
            friend = _context3.sent;
            res.send({
              friendRequest: requestUpdated,
              friend: friend
            });
            _context3.next = 24;
            break;
          case 20:
            _context3.prev = 20;
            _context3.t0 = _context3["catch"](0);
            res.status(400);
            throw new Error(_context3.t0.message);
          case 24:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[0, 20]]);
  }));
  return function (_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}());

//@description     Delete friend
//@route           PATCH /api/friends/requests/:requestId/reject
//@access          Protected
var rejectRequest = asyncHandler( /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(req, res) {
    var requestId, friendRequest, requestUpdated;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            requestId = req.params.requestId;
            _context4.next = 4;
            return FriendRequest.findOne({
              _id: requestId
            });
          case 4:
            friendRequest = _context4.sent;
            if (friendRequest) {
              _context4.next = 7;
              break;
            }
            throw new NotFoundError("Request not found!");
          case 7:
            if (!(friendRequest.status === 'accepted')) {
              _context4.next = 9;
              break;
            }
            throw new BadRequestError("Request had been accepted!");
          case 9:
            if (!(friendRequest.status === 'rejected')) {
              _context4.next = 11;
              break;
            }
            throw new BadRequestError("Request had already been rejected!");
          case 11:
            _context4.next = 13;
            return FriendRequest.findByIdAndUpdate(requestId, {
              status: 'rejected'
            }, {
              "new": true,
              upsert: true
            });
          case 13:
            requestUpdated = _context4.sent;
            res.send(requestUpdated);
            _context4.next = 21;
            break;
          case 17:
            _context4.prev = 17;
            _context4.t0 = _context4["catch"](0);
            res.status(400);
            throw new Error(_context4.t0.message);
          case 21:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, null, [[0, 17]]);
  }));
  return function (_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}());

//@description     Delete friend
//@route           PATCH /api/friends/requests/:requestId/cancel
//@access          Protected
var cancelRequest = asyncHandler( /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(req, res) {
    var requestId, friendRequest, requestDeleted;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            requestId = req.params.requestId;
            _context5.next = 4;
            return FriendRequest.findOne({
              _id: requestId
            });
          case 4:
            friendRequest = _context5.sent;
            if (friendRequest) {
              _context5.next = 7;
              break;
            }
            throw new NotFoundError("Request not found!");
          case 7:
            _context5.next = 9;
            return FriendRequest.findByIdAndDelete(requestId);
          case 9:
            requestDeleted = _context5.sent;
            res.send(requestDeleted);
            _context5.next = 17;
            break;
          case 13:
            _context5.prev = 13;
            _context5.t0 = _context5["catch"](0);
            res.status(400);
            throw new Error(_context5.t0.message);
          case 17:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[0, 13]]);
  }));
  return function (_x9, _x10) {
    return _ref5.apply(this, arguments);
  };
}());
module.exports = {
  fetchRequests: fetchRequests,
  createRequest: createRequest,
  acceptRequest: acceptRequest,
  rejectRequest: rejectRequest,
  cancelRequest: cancelRequest
};