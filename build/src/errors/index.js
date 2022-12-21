"use strict";

var CustomAPIError = require('./custom-api');
var UnauthenticatedError = require('./unauthenticated');
var NotFoundError = require('./not-found');
var BadRequestError = require('./bad-request');
module.exports = {
  CustomAPIError: CustomAPIError,
  UnauthenticatedError: UnauthenticatedError,
  NotFoundError: NotFoundError,
  BadRequestError: BadRequestError
};