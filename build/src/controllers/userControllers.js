"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var asyncHandler = require("express-async-handler");
var User = require("../models/userModel");
var generateToken = require("../config/generateToken");
var _require = require("../errors"),
  BadRequestError = _require.BadRequestError;
var _require2 = require("http-status-codes"),
  StatusCodes = _require2.StatusCodes;
var cloudinary = require("../utils/cloudinary");
var bcrypt = require("bcryptjs");

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
var searchUser = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var keyword, users;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            keyword = req.query.search ? {
              $or: [{
                username: {
                  $regex: req.query.search,
                  $options: "i"
                }
              }, {
                email: {
                  $regex: req.query.search,
                  $options: "i"
                }
              }]
            } : {};
            _context.next = 3;
            return User.find(keyword).find({
              _id: {
                $ne: req.user._id
              }
            }).select('_id username firstname lastname email avatar background about statusMessage');
          case 3:
            users = _context.sent;
            res.send(users);
          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return function searchUser(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

//@description     Register new user
//@route           POST /api/user/
//@access          Public
var registerUser = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(req, res) {
    var _req$body, username, firstname, lastname, email, password, usernameExists, emailExists, user;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _req$body = req.body, username = _req$body.username, firstname = _req$body.firstname, lastname = _req$body.lastname, email = _req$body.email, password = _req$body.password;
            if (!(!username || !email || !password || !firstname || !lastname)) {
              _context2.next = 3;
              break;
            }
            throw new BadRequestError("Please Enter all the Fields");
          case 3:
            _context2.next = 5;
            return User.findOne({
              username: username
            });
          case 5:
            usernameExists = _context2.sent;
            if (!usernameExists) {
              _context2.next = 8;
              break;
            }
            throw new BadRequestError("Username already exists");
          case 8:
            _context2.next = 10;
            return User.findOne({
              email: email
            });
          case 10:
            emailExists = _context2.sent;
            if (!emailExists) {
              _context2.next = 13;
              break;
            }
            throw new BadRequestError("Email already exists");
          case 13:
            _context2.next = 15;
            return User.create({
              username: username,
              firstname: firstname,
              lastname: lastname,
              email: email,
              password: password
            });
          case 15:
            user = _context2.sent;
            if (user) {
              _context2.next = 18;
              break;
            }
            throw new BadRequestError("Something went wrong!");
          case 18:
            res.status(StatusCodes.CREATED).json({
              userData: {
                _id: user._id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                about: user.about,
                avatar: user.avatar,
                background: user.background,
                statusMessage: user.statusMessage
              },
              token: generateToken(user._id)
            });
          case 19:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return function registerUser(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

//@description     Auth the user
//@route           POST /api/users/login
//@access          Public
var authUser = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var _req$body2, email, password, user;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _req$body2 = req.body, email = _req$body2.email, password = _req$body2.password;
            _context3.next = 3;
            return User.findOne({
              email: email
            });
          case 3:
            user = _context3.sent;
            _context3.t0 = !user;
            if (_context3.t0) {
              _context3.next = 9;
              break;
            }
            _context3.next = 8;
            return user.matchPassword(password);
          case 8:
            _context3.t0 = !_context3.sent;
          case 9:
            if (!_context3.t0) {
              _context3.next = 11;
              break;
            }
            throw new BadRequestError("Invalid Email or Password");
          case 11:
            res.json({
              userData: {
                _id: user._id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                about: user.about,
                avatar: user.avatar,
                background: user.background,
                statusMessage: user.statusMessage
              },
              token: generateToken(user._id)
            });
          case 12:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return function authUser(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();
var authJWT = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(req, res) {
    var token;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            token = req.headers.authorization.split(" ")[1];
            return _context4.abrupt("return", res.json({
              userData: req.user,
              token: token
            }));
          case 2:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return function authJWT(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

//@description     Get or Search all users
//@route           GET /api/user/profile/:id
//@access          Public
var getUserProfile = /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(req, res) {
    var users;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return User.findOne({
              _id: req.params.id
            }).select('_id username avatar background about');
          case 2:
            users = _context5.sent;
            res.send(users);
          case 4:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return function getUserProfile(_x9, _x10) {
    return _ref5.apply(this, arguments);
  };
}();

//@description     Update profile
//@route           PATCH /api/user/profile
//@access          Public
var updateProfile = /*#__PURE__*/function () {
  var _ref6 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(req, res) {
    var about, avatar, background, result, _result, user;
    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            about = req.body.about;
            if (!req.files.avatar) {
              _context6.next = 6;
              break;
            }
            _context6.next = 4;
            return cloudinary.uploader.upload(req.files.avatar[0].path);
          case 4:
            result = _context6.sent;
            avatar = {
              url: result.secure_url,
              cloudId: result.public_id
            };
          case 6:
            if (!req.files.background) {
              _context6.next = 11;
              break;
            }
            _context6.next = 9;
            return cloudinary.uploader.upload(req.files.background[0].path);
          case 9:
            _result = _context6.sent;
            background = {
              url: _result.secure_url,
              cloudId: _result.public_id
            };
          case 11:
            if (!avatar) {
              _context6.next = 14;
              break;
            }
            _context6.next = 14;
            return User.findByIdAndUpdate(req.user._id, {
              avatar: avatar
            });
          case 14:
            if (!background) {
              _context6.next = 17;
              break;
            }
            _context6.next = 17;
            return User.findByIdAndUpdate(req.user._id, {
              background: background
            });
          case 17:
            if (!about) {
              _context6.next = 20;
              break;
            }
            _context6.next = 20;
            return User.findByIdAndUpdate(req.user._id, {
              about: about
            });
          case 20:
            _context6.next = 22;
            return User.findById(req.user._id);
          case 22:
            user = _context6.sent;
            res.status(StatusCodes.OK).send(user);
          case 24:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));
  return function updateProfile(_x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}();

//@description     Update status message
//@route           PATCH /api/user/status
//@access          Public
var updateStatusMessage = /*#__PURE__*/function () {
  var _ref7 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(req, res) {
    var statusMessage, user;
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            statusMessage = req.body.statusMessage;
            if (!statusMessage) {
              _context7.next = 4;
              break;
            }
            _context7.next = 4;
            return User.findByIdAndUpdate(req.user._id, {
              statusMessage: statusMessage
            });
          case 4:
            _context7.next = 6;
            return User.findById(req.user._id);
          case 6:
            user = _context7.sent;
            res.status(StatusCodes.OK).send(user);
          case 8:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));
  return function updateStatusMessage(_x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}();

//@description     Change account password
//@route           PATCH /api/user/password
//@access          Public
var changePassword = /*#__PURE__*/function () {
  var _ref8 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(req, res) {
    var _req$body3, password, newPassword, user, updatePassword, salt;
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _req$body3 = req.body, password = _req$body3.password, newPassword = _req$body3.newPassword;
            _context8.next = 3;
            return User.findById(req.user._id);
          case 3:
            user = _context8.sent;
            _context8.next = 6;
            return user.matchPassword(password);
          case 6:
            if (_context8.sent) {
              _context8.next = 8;
              break;
            }
            throw new BadRequestError("password does not match");
          case 8:
            if (!newPassword) {
              _context8.next = 20;
              break;
            }
            updatePassword = newPassword;
            _context8.next = 12;
            return bcrypt.genSalt(10);
          case 12:
            salt = _context8.sent;
            _context8.next = 15;
            return bcrypt.hash(updatePassword, salt);
          case 15:
            updatePassword = _context8.sent;
            _context8.next = 18;
            return User.findByIdAndUpdate(req.user._id, {
              password: updatePassword
            });
          case 18:
            _context8.next = 21;
            break;
          case 20:
            throw new BadRequestError("New password is empty");
          case 21:
            res.status(StatusCodes.OK).send("Successfully chang password!");
          case 22:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));
  return function changePassword(_x15, _x16) {
    return _ref8.apply(this, arguments);
  };
}();
module.exports = {
  searchUser: searchUser,
  registerUser: registerUser,
  authUser: authUser,
  authJWT: authJWT,
  updateProfile: updateProfile,
  getUserProfile: getUserProfile,
  updateStatusMessage: updateStatusMessage,
  changePassword: changePassword
};