"use strict";

var _require = require('http-status-codes'),
  StatusCodes = _require.StatusCodes;
var notFound = function notFound(req, res) {
  res.status(404).send("Not Found - ".concat(req.originalUrl));
};
var errorHandler = function errorHandler(err, req, res, next) {
  var customError = {
    // set default
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong, please try again later!'
  };
  if (err.name === 'ValidationError') {
    customError.msg = Object.values(err.errors).map(function (item) {
      return item.message;
    }).join(',');
    customError.statusCode = 400;
  }
  if (err.code && err.code === 11000) {
    customError.msg = "Duplicate value entered for ".concat(Object.keys(err.keyValue), " field, please enter another value");
    customError.statusCode = 400;
  }
  if (err.name === 'CastError') {
    customError.msg = "No item found with id: ".concat(err.value);
    customError.statusCode = 404;
  }
  console.log(err);
  return res.status(customError.statusCode).json({
    msg: customError.msg
  });
};
module.exports = {
  notFound: notFound,
  errorHandler: errorHandler
};