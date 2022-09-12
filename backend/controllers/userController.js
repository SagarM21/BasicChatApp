const asyncHandler = require("express-async-handler");
const generateToken = require("../config/generateToken");
const User = require("../models/user");

const registerUser = asyncHandler(async (req, res) => {
	const { name, email, password, pic } = req.body;

	if (!name || !email || !password) {
		res.status(400);
		throw new Error("Please enter all the required fields.");
	}

	const isUserExists = await User.findOne({ email });
	if (isUserExists) {
		res.status(400);
		throw new Error("User already exists, kindly login!");
	}

	const user = await User.create({
		name,
		email,
		password,
		pic,
	});

	// if all goes well
	if (user) {
		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			pic: user.pic,
			token: generateToken(user._id),
		});
	} else {
		res.status(400);
		throw new Error("Failed to create the user, try again!");
	}
});

const authUser = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email });

	if (user && (await user.matchPassword(password))) {
		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			pic: user.pic,
			token: generateToken(user._id),
		});
	} else {
		res.status(400);
		throw new Error("Invalid Credentials!");
	}
});

const allUsers = asyncHandler(async (req, res) => {
	const keyword = req.query.search
		? {
				$or: [
					{ name: { $regex: req.query.search, $options: "i" } },
					{ email: { $regex: req.query.search, $options: "i" } },
				],
		  }
		: {};

	const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
	res.send(users);
});

module.exports = { registerUser, authUser, allUsers };
