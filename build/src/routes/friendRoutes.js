"use strict";

var express = require("express");
var _require = require("../controllers/friendControllers"),
  fetchFriends = _require.fetchFriends,
  removeFriend = _require.removeFriend;
var _require2 = require("../middleware/authMiddleware"),
  protect = _require2.protect;
var router = express.Router();
router.route("/").get(protect, fetchFriends);
router.route("/:friendId/delete")["delete"](protect, removeFriend);
module.exports = router;