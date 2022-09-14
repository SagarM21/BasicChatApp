const express = require("express");
const multer = require("multer");
const { uploadPdf } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");
const router = require("./messageRoute");

const storage = multer.memoryStorage({
	destination: function (req, file, callback) {
		callback(null, "");
	},
});
const upload = multer({ storage }).single("pdf");
router.route("/pdf").post(protect, upload, uploadPdf);

module.exports = router;
