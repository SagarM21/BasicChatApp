const asyncHandler = require("express-async-handler");
const Chat = require("../models/chat");
const User = require("../models/user");

const accessChat = asyncHandler(async (req, res) => {
	const { userId } = req.body;

	if (!userId) {
		console.log("UserId param not sent with request");
		return res.sendStatus(400);
	}

	var isChatExists = await Chat.find({
		// both requests need to be true
		$and: [
			{ users: { $elemMatch: { $eq: req.user._id } } },
			{ users: { $elemMatch: { $eq: userId } } },
		],
	})
		.populate("users", "-password")
		.populate("latestMessage");

	isChatExists = await User.populate(isChatExists, {
		path: "latestMessage.sender",
		select: "name pic email",
	});

	if (isChatExists.length > 0) {
		res.send(isChatExists[0]);
	} else {
		var chatData = {
			chatName: "sender",
			users: [req.user._id, userId],
		};

		try {
			const createdChat = await Chat.create(chatData);
			const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
				"users",
				"-password"
			);
			res.status(200).json(FullChat);
		} catch (error) {
			res.status(400);
			throw new Error(error.message);
		}
	}
});

module.exports = { accessChat };
