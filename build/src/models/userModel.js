"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
var userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    url: {
      type: String,
      trim: true
    },
    cloudId: {
      type: String,
      trim: true
    }
  },
  background: {
    url: {
      type: String,
      trim: true
    },
    cloudId: {
      type: String,
      trim: true
    }
  },
  about: {
    type: String
  },
  statusMessage: {
    type: String
  }
}, {
  timestamps: true
});
userSchema.methods.matchPassword = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(enteredPassword) {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return bcrypt.compare(enteredPassword, this.password);
          case 2:
            return _context.abrupt("return", _context.sent);
          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();
userSchema.pre("save", /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(next) {
    var salt;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (!this.isModified) {
              next();
            }
            _context2.next = 3;
            return bcrypt.genSalt(10);
          case 3:
            salt = _context2.sent;
            _context2.next = 6;
            return bcrypt.hash(this.password, salt);
          case 6:
            this.password = _context2.sent;
          case 7:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return function (_x2) {
    return _ref2.apply(this, arguments);
  };
}());

// userSchema.pre("findByIdAndUpdate", async function (next) {
//   const password = this.getUpdate().$set.password;
//   if (!password) {
//     return next();
//   }

//   try {
//     const salt = await bcrypt.genSalt(10);
//     const hash = await bcrypt.hash(password, salt);
//     this.update({}, { $set: { password: hash } });
//   } catch (error) {
//     return next(error);
//   }
// });

var User = mongoose.model("User", userSchema);
module.exports = User;