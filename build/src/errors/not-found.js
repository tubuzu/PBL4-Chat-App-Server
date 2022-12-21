"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var _require = require('http-status-codes'),
  StatusCodes = _require.StatusCodes;
var CustomAPIError = require('./custom-api');
var NotFoundError = /*#__PURE__*/function (_CustomAPIError) {
  (0, _inherits2["default"])(NotFoundError, _CustomAPIError);
  var _super = _createSuper(NotFoundError);
  function NotFoundError(message) {
    var _this;
    (0, _classCallCheck2["default"])(this, NotFoundError);
    _this = _super.call(this, message);
    _this.statusCode = StatusCodes.NOT_FOUND;
    return _this;
  }
  return (0, _createClass2["default"])(NotFoundError);
}(CustomAPIError);
module.exports = NotFoundError;