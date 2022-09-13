const express = require("express");
const dotenv = require("dotenv");
const chats = require("./data/data");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoute = require("./routes/messageRoute");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
app.use(cors());
dotenv.config();
connectDB();

// accepts the json data
app.use(express.json());

app.get("/", (req, res) => {
	res.send("API is running");
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoute);

// for the errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`.yellow.bold);
});

const io = require("socket.io")(server, {
	pingTimeout: 60000,
	cors: { origin: "http://localhost:3000" },
});

io.on("connection", (socket) => {
	console.log("Connected to socket.io");
	socket.on("setup", (userData) => {
		socket.join(userData._id);

		// as soon as user joins we get its id
		// console.log(userData._id);
		socket.emit("connected");
	});

	// JOIN
	socket.on("join chat", (room) => {
		socket.join(room);
		console.log("User joined room" + room);
	});

	// New msg
	socket.on("new message", (newMessageReceived) => {
		var chat = newMessageReceived.chat;

		if (!chat.users) return console.log("chat.users is not defined");

		chat.users.forEach((user) => {
			if (user._id === newMessageReceived.sender._id) return;

			socket.in(user._id).emit("message received", newMessageReceived);
		});
	});
});
