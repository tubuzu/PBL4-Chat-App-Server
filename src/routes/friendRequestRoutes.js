const express = require("express");
const {
  createRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  fetchRequests,
} = require("../controllers/friendRequestControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, fetchRequests).post(protect, createRequest);
router.route("/:requestId/accept").patch(protect, acceptRequest);
router.route("/:requestId/reject").patch(protect, rejectRequest);
router.route("/:requestId/cancel").patch(protect, cancelRequest);

module.exports = router;