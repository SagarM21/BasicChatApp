const Message = require("../models/message");
const AWS = require("aws-sdk");
const { uuid } = require("uuidv4");
const dotenv = require("dotenv");

dotenv.config();

const s3 = new AWS.S3({
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});

exports.uploadPdf = async (req, res) => {
	let myFile = req.file.originalname.split(".");
	const fileType = myFile[myFile.length - 1];

	const params = {
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: `${uuid()}.${fileType}`,
		Body: req.file.buffer,
	};

	s3.upload(params, (error, data) => {
		if (error) {
			res.status(500).send(error);
		}

		res.status(200).send(data);
	});
};
