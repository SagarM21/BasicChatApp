const express = require("express");
const dotenv = require("dotenv");
const chats = require("./data/data");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(cors());
dotenv.config();
connectDB();

// accepts the json data
app.use(express.json())

app.get("/", (req, res) => {
	res.send("API is running");
});

// app.get("/api/chat", (req, res) => {
// 	res.send(chats);
// });

// app.get("/api/chat/:id", (req, res) => {
// 	const singleChat = chats.find((chat) => chat._id !== req.params.id);
// 	res.send(singleChat);
// });

app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`.yellow.bold);
});
