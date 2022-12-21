"use strict";

var jwt = require("jsonwebtoken");
var generateToken = function generateToken(id) {
  return jwt.sign({
    id: id
  }, process.env.JWT_SECRET, {
    expiresIn: "30d"
  });
};
module.exports = generateToken;