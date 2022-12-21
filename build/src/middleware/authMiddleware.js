"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var jwt = require("jsonwebtoken");
var User = require("../models/userModel.js");
var asyncHandler = require("express-async-handler");
var protect = asyncHandler( /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res, next) {
    var token, decoded;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(req.headers.authorization && req.headers.authorization.startsWith("Bearer"))) {
              _context.next = 14;
              break;
            }
            _context.prev = 1;
            token = req.headers.authorization.split(" ")[1];
            //decodes token id
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            _context.next = 6;
            return User.findById(decoded.id).select("-password");
          case 6:
            req.user = _context.sent;
            next();
            _context.next = 14;
            break;
          case 10:
            _context.prev = 10;
            _context.t0 = _context["catch"](1);
            res.status(401);
            throw new Error("Not authorized, token failed");
          case 14:
            if (token) {
              _context.next = 17;
              break;
            }
            res.status(401);
            throw new Error("Not authorized, no token");
          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[1, 10]]);
  }));
  return function (_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}());
module.exports = {
  protect: protect
};