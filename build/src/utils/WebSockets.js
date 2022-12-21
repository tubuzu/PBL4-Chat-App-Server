"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
var Friend = require("../models/friendModel");
var Group = require("../models/groupModel");
var WebSockets = /*#__PURE__*/function () {
  function WebSockets() {
    (0, _classCallCheck2["default"])(this, WebSockets);
  }
  (0, _createClass2["default"])(WebSockets, [{
    key: "connection",
    value: function connection(socket) {
      var tempId = '';
      // event fired when the chat room is disconnected
      socket.on("disconnect", function () {
        console.log("user ".concat(tempId, " disconnect"));
        WebSockets.onlineUsers["delete"](tempId);
        tempId = '';
      });
      // add identity of user mapped to the socket id
      socket.on("identity", function (userId) {
        // const newUser = { socketId: socket.id, userId: userId };
        WebSockets.onlineUsers.set(userId, socket.id);
        tempId = userId;
        console.log("user ".concat(userId, " connect"));
      });
      // onConversationJoin
      socket.on("onConversationJoin", function (_ref) {
        var conversationId = _ref.conversationId;
        // console.log(
        //   `${tempId} joined a Conversation of ID: ${conversationId}`,
        // );
        socket.join("conversation-".concat(conversationId));
        // console.log(socket.rooms);
        global.io.to("conversation-".concat(conversationId)).emit('userJoin');
      });
      // onConversationLeave
      socket.on("onConversationLeave", function (_ref2) {
        var conversationId = _ref2.conversationId;
        // console.log('onConversationLeave');
        socket.leave("conversation-".concat(conversationId));
        // console.log(socket.rooms);
        global.io.to("conversation-".concat(conversationId)).emit('userLeave');
      });
      // onGroupJoin
      socket.on("onGroupJoin", function (_ref3) {
        var groupId = _ref3.groupId;
        // console.log(
        //   `${tempId} joined a Group of ID: ${groupId}`,
        // );
        socket.join("group-".concat(groupId));
        // console.log(socket.rooms);
        global.io.to("group-".concat(groupId)).emit('userGroupJoin');
      });
      // onGroupLeave
      socket.on("onGroupLeave", function (_ref4) {
        var groupId = _ref4.groupId;
        // console.log('onGroupLeave');
        socket.leave("group-".concat(groupId));
        // console.log(socket.rooms);
        global.io.to("group-".concat(groupId)).emit('userGroupLeave');
      });

      // onTypingStart
      socket.on("onTypingStart", function (_ref5) {
        var conversationId = _ref5.conversationId;
        console.log('onTypingStart');
        console.log(conversationId, socket.rooms);
        socket.to("conversation-".concat(conversationId)).emit('onTypingStart');
      });

      // onTypingStop
      socket.on("onTypingStop", function (_ref6) {
        var conversationId = _ref6.conversationId;
        console.log('onTypingStop');
        console.log(conversationId, socket.rooms);
        socket.to("conversation-".concat(conversationId)).emit('onTypingStop');
      });

      //
      socket.on("getOnlineGroupUsers", /*#__PURE__*/function () {
        var _ref8 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(_ref7) {
          var groupId, group, onlineUsers, offlineUsers;
          return _regenerator["default"].wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  groupId = _ref7.groupId;
                  _context.next = 3;
                  return Group.findById(groupId).populate({
                    path: "users",
                    select: "-password"
                  });
                case 3:
                  group = _context.sent;
                  if (group) {
                    _context.next = 6;
                    break;
                  }
                  return _context.abrupt("return");
                case 6:
                  onlineUsers = [];
                  offlineUsers = [];
                  group.users.forEach(function (user) {
                    var socket = WebSockets.onlineUsers.get(user._id.toString());
                    socket ? onlineUsers.push(user) : offlineUsers.push(user);
                  });
                  socket.emit('onlineGroupUsersReceived', {
                    onlineUsers: onlineUsers,
                    offlineUsers: offlineUsers
                  });
                case 10:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee);
        }));
        return function (_x) {
          return _ref8.apply(this, arguments);
        };
      }());

      //getOnlineFriends
      socket.on("getOnlineFriends", /*#__PURE__*/function () {
        var _ref10 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(_ref9) {
          var userId, friends, onlineFriends;
          return _regenerator["default"].wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  userId = _ref9.userId;
                  _context2.next = 3;
                  return Friend.find({
                    $or: [{
                      sender: {
                        $eq: userId
                      }
                    }, {
                      receiver: {
                        $eq: userId
                      }
                    }]
                  }).populate('sender', '-password').populate('receiver', '-password');
                case 3:
                  friends = _context2.sent;
                  onlineFriends = [];
                  if (friends.length) {
                    _context2.next = 8;
                    break;
                  }
                  socket.emit('getOnlineFriends', onlineFriends);
                  return _context2.abrupt("return");
                case 8:
                  friends.forEach(function (friend) {
                    var recipient = friend.sender._id.toString() === userId ? friend.receiver._id : friend.sender._id;
                    var socket = WebSockets.onlineUsers.get(recipient.toString());
                    if (socket) onlineFriends.push(friend);
                  });
                  socket.emit('getOnlineFriends', onlineFriends);
                case 10:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        }));
        return function (_x2) {
          return _ref10.apply(this, arguments);
        };
      }());

      //onMessage
      // global.eventEmitter.on('message.create', (conv, mess) => {
      //   console.log('message.create');
      //   global.io.to(socket.id).emit('onMessage', { message: mess, conversation: conv });
      // })

      //onGroupMessage
      // global.eventEmitter.on('group.message.create', (group, mess) => {
      //   socket.emit('onGroupMessage', { message: mess, group: group });
      // })

      //conversation.create
      // global.eventEmitter.on('conversation.create', (conversation) => {
      //   console.log("conv.create", conversation, WebSockets.onlineUsers.get(conversation.recipient._id.toString()))
      //   global.io.to(WebSockets.onlineUsers.get(conversation.recipient._id.toString())).emit('onConversation', conversation);
      // })
    }
  }], [{
    key: "getByValue",
    value: function getByValue(searchValue) {
      var _iterator = _createForOfIteratorHelper(WebSockets.onlineUsers.entries()),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _step$value = (0, _slicedToArray2["default"])(_step.value, 2),
            key = _step$value[0],
            value = _step$value[1];
          if (value === searchValue) return key;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }]);
  return WebSockets;
}();
(0, _defineProperty2["default"])(WebSockets, "onlineUsers", new Map());
(0, _defineProperty2["default"])(WebSockets, "getOnlineUsers", function () {
  return WebSockets.onlineUsers;
});
module.exports = WebSockets;