const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
	sendMessage,
	allMessages,
} = require("../controllers/messageControllers");
const router = express.Router();

// send chat
router.route("/").post(protect, sendMessage);

// fetch single chat
router.route("/:chatId").get(protect, allMessages);

module.exports = router;
