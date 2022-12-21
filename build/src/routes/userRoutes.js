"use strict";

var express = require("express");
var _require = require("../controllers/userControllers"),
  registerUser = _require.registerUser,
  authUser = _require.authUser,
  searchUser = _require.searchUser,
  authJWT = _require.authJWT,
  updateProfile = _require.updateProfile,
  updateStatusMessage = _require.updateStatusMessage,
  getUserProfile = _require.getUserProfile,
  changePassword = _require.changePassword;
var _require2 = require("../middleware/authMiddleware"),
  protect = _require2.protect;
var router = express.Router();
router.route("/").get(protect, searchUser);
router.route("/").post(registerUser);
router.post("/login", authUser);
router.route("/authJWT").get(protect, authJWT);
router.route("/profile/:id").get(protect, getUserProfile);
router.route("/profile").patch(protect, updateProfile);
router.route("/status").patch(protect, updateStatusMessage);
router.route("/password").patch(protect, changePassword);
module.exports = router;