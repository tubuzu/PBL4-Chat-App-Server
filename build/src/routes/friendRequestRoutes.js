"use strict";

var express = require("express");
var _require = require("../controllers/friendRequestControllers"),
  createRequest = _require.createRequest,
  acceptRequest = _require.acceptRequest,
  rejectRequest = _require.rejectRequest,
  cancelRequest = _require.cancelRequest,
  fetchRequests = _require.fetchRequests;
var _require2 = require("../middleware/authMiddleware"),
  protect = _require2.protect;
var router = express.Router();
router.route("/").get(protect, fetchRequests).post(protect, createRequest);
router.route("/:requestId/accept").patch(protect, acceptRequest);
router.route("/:requestId/reject").patch(protect, rejectRequest);
router.route("/:requestId/cancel").patch(protect, cancelRequest);
module.exports = router;