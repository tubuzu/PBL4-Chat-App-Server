"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
// const asyncHandler = require("express-async-handler");
var Conversation = require("../models/conversationModel");
var User = require("../models/userModel");
var _require = require('../errors'),
  BadRequestError = _require.BadRequestError,
  NotFoundError = _require.NotFoundError;
var _require2 = require("http-status-codes"),
  StatusCodes = _require2.StatusCodes;
var WebSockets = require("../utils/WebSockets");

//@description     Get or Search all conversations
//@route           GET /api/conversations?search=
//@access          Protected
var searchConversation = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var keyword, convs;
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
            return Conversation.find(keyword).find({
              $or: [{
                recipient: {
                  $eq: req.user._id
                }
              }, {
                creator: {
                  $eq: req.user._id
                }
              }]
            }).populate("creator", "-password").populate("recipient", "-password").populate("latestMessage").sort({
              updatedAt: -1
            });
          case 3:
            convs = _context.sent;
            res.send(convs);
          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return function searchConversation(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

//@description     Create or fetch One to One Conversation
//@route           POST /api/conversation/
//@access          Protected
var createConversation = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(req, res) {
    var userId, userExist, isConversation, conversationData, createdConversation, FullConversation, recipientSocket;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            userId = req.body.userId;
            if (userId) {
              _context2.next = 4;
              break;
            }
            console.log("UserId param not sent with request");
            throw new BadRequestError('UserId param not sent with request');
          case 4:
            _context2.next = 6;
            return User.find({
              _id: {
                $eq: userId
              }
            });
          case 6:
            userExist = _context2.sent;
            if (userExist.length) {
              _context2.next = 10;
              break;
            }
            console.log("UserId does not exist!");
            throw new NotFoundError("The user with id ".concat(userId, " does not exist!"));
          case 10:
            _context2.next = 12;
            return Conversation.find({
              $or: [{
                $and: [{
                  creator: {
                    $eq: req.user._id
                  }
                }, {
                  recipient: {
                    $eq: userId
                  }
                }]
              }, {
                $and: [{
                  creator: {
                    $eq: userId
                  }
                }, {
                  recipient: {
                    $eq: req.user._id
                  }
                }]
              }]
            });
          case 12:
            isConversation = _context2.sent;
            if (!isConversation.length) {
              _context2.next = 17;
              break;
            }
            res.status(StatusCodes.OK).json(isConversation[0]);
            // throw new BadRequestError('Conversation exists!');
            _context2.next = 27;
            break;
          case 17:
            conversationData = {
              creator: req.user._id,
              recipient: userId
            };
            _context2.next = 20;
            return Conversation.create(conversationData);
          case 20:
            createdConversation = _context2.sent;
            _context2.next = 23;
            return Conversation.findOne({
              _id: createdConversation._id
            }).populate("creator", "-password").populate("recipient", "-password");
          case 23:
            FullConversation = _context2.sent;
            recipientSocket = WebSockets.onlineUsers.get(FullConversation.recipient._id.toString());
            if (recipientSocket) global.io.to(recipientSocket).emit('onConversation', FullConversation);
            res.status(StatusCodes.CREATED).json(FullConversation);
          case 27:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return function createConversation(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

//@description     Fetch all Conversations for a user
//@route           GET /api/conversations/
//@access          Protected
var fetchConversations = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var conversations;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return Conversation.find({
              $or: [{
                creator: {
                  $eq: req.user._id
                }
              }, {
                recipient: {
                  $eq: req.user._id
                }
              }]
            }).populate("creator", "-password").populate("recipient", "-password").populate("latestMessage").sort({
              updatedAt: -1
            });
          case 2:
            conversations = _context3.sent;
            // .then(async (results) => {
            //     results = await User.populate(results, {
            //         path: "latestMessage.sender",
            //         select: "name avatar email",
            //     });
            //     res.status(200).send(results);
            // });
            res.status(StatusCodes.OK).send(conversations);
          case 4:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return function fetchConversations(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

//@description     Fetch all Conversations for a user
//@route           GET /api/conversations/
//@access          Protected
var fetchConversationById = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(req, res) {
    var conversation;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return Conversation.find({
              $and: [{
                $or: [{
                  creator: {
                    $eq: req.user._id
                  }
                }, {
                  recipient: {
                    $eq: req.user._id
                  }
                }]
              }, {
                _id: req.params.id
              }]
            }).populate("creator", "-password").populate("recipient", "-password").populate("latestMessage");
          case 2:
            conversation = _context4.sent;
            if (!(conversation.length < 1)) {
              _context4.next = 5;
              break;
            }
            throw new NotFoundError("The user is not found or you are not in conversation with this user.");
          case 5:
            res.status(StatusCodes.OK).send(conversation);
          case 6:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return function fetchConversationById(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

// const renameGroup = asyncHandler(async (req, res) => {
//     const { conversationId, conversationName } = req.body;

//     const updatedConversation = await Conversation.findByIdAndUpdate(
//         conversationId,
//         {
//             conversationName: conversationName,
//         },
//         {
//             new: true,
//         }
//     )
//         .populate("users", "-password")
//         .populate("groupAdmin", "-password");

//     if (!updatedConversation) {
//         res.status(404);
//         throw new Error("Conversation Not Found");
//     } else {
//         res.json(updatedConversation);
//     }
// });

module.exports = {
  createConversation: createConversation,
  fetchConversations: fetchConversations,
  fetchConversationById: fetchConversationById,
  searchConversation: searchConversation
};