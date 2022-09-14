import { ChatState } from "../../Context/ChatProvider";
import ProfileModal from "./ProfileModal";
import { FormControl } from "@chakra-ui/form-control";
import { Input, InputGroup, InputRightElement } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import {
	Button,
	IconButton,
	SelectField,
	Spinner,
	useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull } from "../../config/ChatLogics";
import { useEffect, useState } from "react";
import axios from "axios";
import "../style.css";
import ChatUI from "./ChatUI";
import io from "socket.io-client";
import Lottie from "react-lottie";
import animationData from "../../typingAnimation/typing.json";
import "../style.css";

// while developing
const ENDPOINT = "http://localhost:5000";

// in production
// const ENDPOINT = "https://talkrandomly.herokuapp.com/";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
	// const [show, setShow] = useState(false);
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(false);
	const [newMessage, setNewMessage] = useState();
	const [socketConnected, setSocketConnected] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const [typing, setTyping] = useState(false);
	const [file, setFile] = useState([]);
	const [pdfFileError, setPdfFileError] = useState("");
	const { user, selectedChat, setSelectedChat, notification, setNotification } =
		ChatState();

	const toast = useToast();

	// ANIMATION PART
	const defaultOptions = {
		loop: true,
		autoplay: true,
		animationData: animationData,
		rendererSettings: {
			preserveAspectRatio: "xMidYMid slice",
		},
	};

	useEffect(() => {
		socket = io(ENDPOINT);
		socket.emit("setup", user);

		socket.on("connected", () => setSocketConnected(true));

		socket.on("typing", () => setIsTyping(true));
		socket.on("stop typing", () => setIsTyping(false));
	}, []);

	const fetchMessages = async () => {
		if (!selectedChat) return;

		try {
			const config = {
				headers: {
					Authorization: `Bearer ${user.token}`,
				},
			};

			setLoading(true);

			const { data } = await axios.get(
				`/api/message/${selectedChat._id}`,
				config
			);
			// console.log(messages);
			setMessages(data);
			setLoading(false);

			socket.emit("join chat", selectedChat._id);
		} catch (error) {
			toast({
				title: "Error Occurred!",
				description: "Failed to Load the Messages",
				status: "error",
				duration: 5000,
				isClosable: true,
				position: "bottom",
			});
		}
	};

	useEffect(() => {
		fetchMessages();
		selectedChatCompare = selectedChat;
	}, [selectedChat]);

	// console.log(notification, "----------");

	// RECEIVING THE MESSAGE
	useEffect(() => {
		socket.on("message received", (newMessageReceived) => {
			if (
				!selectedChatCompare ||
				selectedChatCompare._id !== newMessageReceived.chat._id
			) {
				if (!notification.includes(newMessageReceived)) {
					setNotification([newMessageReceived, ...notification]);
					setFetchAgain(!fetchAgain);
				}
			} else {
				setMessages([...messages, newMessageReceived]);
			}
		});
	});

	const sendMessage = async (event) => {
		// if (file) {
		// 	const messageObject = {
		// 		id: selectedChat,
		// 		type: "file",
		// 		body: "file",
		// 		mimeType: file.type,
		// 		fileName: file.name,
		// 	};
		// 	setMessages("");
		// 	setFile();
		// 	socket.emit("new message", messageObject);
		// 	setMessages([...messages, messageObject]);
		// }

		if (file !== null) {
			setFile(file);
		} else {
			setFile(null);
		}

		if (event.key === "Enter" && newMessage) {
			socket.emit("stop typing", selectedChat._id);
			try {
				const config = {
					headers: {
						"Content-type": "application/json",
						Authorization: `Bearer ${user.token}`,
					},
				};
				setNewMessage("");
				const { data } = await axios.post(
					"/api/message",
					{
						content: newMessage,
						chatId: selectedChat,
					},
					config
				);

				// console.log(data);

				socket.emit("new message", data);
				setMessages([...messages, data]);
			} catch (error) {
				toast({
					title: "Error Occurred!",
					description: "Failed to send the Message",
					status: "error",
					duration: 5000,
					isClosable: true,
					position: "bottom",
				});
			}
		}
	};

	const typingHandler = (e) => {
		setNewMessage(e.target.value);

		// TYPING INDICATOR

		// show those dots
		if (!socketConnected) return;

		if (!typing) {
			setTyping(true);
			socket.emit("typing", selectedChat._id);
		}

		let lastTypingTime = new Date().getTime();
		var timeLength = 3000;
		setTimeout(() => {
			var timeNow = new Date().getTime();
			var timeDiff = timeNow - lastTypingTime;

			if (timeDiff >= timeLength && typing) {
				socket.emit("stop typing", selectedChat._id);
				setTyping(false);
			}
		}, timeLength);
	};

	const pdfSubmit = async (e) => {
		e.preventDefault();
		const file = e.target.files[0];

		const { url } = await fetch("/s3Url").then((res) => res.json());
		console.log(url);

		// post the image directly to the s3 bucket
		await fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": "multipart/form-data",
			},
			body: file,
		});

		const imageUrl = url.split("?")[0];
		console.log(imageUrl);
	};

	const fileType = ["application/pdf"];
	const handlePdfFileChange = (e) => {
		let selectedFile = Array.from(e.target.files);

		selectedFile.forEach((f) => {
			if (f !== "application/pdf") {
				setPdfFileError(`${f.name} format is unsupported.`);
				selectedFile = selectedFile.filter((item) => item.name !== f.name);
				return;
			}
			const reader = new FileReader();
			reader.readAsDataURL(f);
			reader.onload = (readerEvent) => {
				setFile((pdfF) => [...pdfF, readerEvent.target.result]);
			};
			console.log(reader);
		});

		// if (selectedFile) {
		// 	if (selectedFile && fileType.includes(selectedFile.type)) {
		// 		let reader = new FileReader();
		// 		reader.readAsDataURL(selectedFile);
		// 		reader.onload = (readerEvent) => {
		// 			setFile((files) => [...files, readerEvent.target.result]);
		// 			setPdfFileError("");
		// 		};
		// 		console.log(reader);
		// 	} else {
		// 		setFile(null);
		// 		setPdfFileError("Please select valid pdf file");
		// 	}
		// } else {
		// 	console.log("select your file");
		// }
	};

	return (
		<>
			{selectedChat ? (
				<>
					<Text
						fontSize={{ base: "28px", md: "30px" }}
						pb={3}
						px={2}
						w='100%'
						fontFamily='Work sans'
						display='flex'
						justifyContent={{ base: "space-between" }}
						alignItems='center'
					>
						<IconButton
							display={{ base: "flex", md: "none" }}
							icon={<ArrowBackIcon />}
							onClick={() => setSelectedChat("")}
						/>
						{
							<>
								{getSender(user, selectedChat.users)}
								<ProfileModal user={getSenderFull(user, selectedChat.users)} />
							</>
						}
					</Text>
					<Box
						display='flex'
						flexDir='column'
						justifyContent='flex-end'
						p={3}
						bg='#E8E8E8'
						w='100%'
						h='100%'
						borderRadius='lg'
						overflowY='hidden'
					>
						{loading ? (
							<Spinner
								size='xl'
								w={20}
								h={20}
								alignSelf='center'
								margin='auto'
							/>
						) : (
							<div className='messages'>
								<ChatUI messages={messages} />
							</div>
						)}

						<FormControl
							onKeyDown={sendMessage}
							id='first-name'
							isRequired
							mt={3}
						>
							{/* typing show */}
							{isTyping ? (
								<div>
									<Lottie
										options={defaultOptions}
										width={70}
										style={{ marginBottom: 15, marginLeft: 0 }}
									/>
								</div>
							) : (
								<></>
							)}

							<InputGroup>
								<Input
									variant='filled'
									bg='#E0E0E0'
									placeholder='Enter a message..'
									value={newMessage}
									onChange={typingHandler}
								/>
								<InputRightElement width='6rem'>
									<Input
										h='1.75rem'
										size='sm'
										type='file'
										accept='.pdf'
										onChange={handlePdfFileChange}
									/>
									{file && file.length ? (
										<div>
											{file.map((f, i) => (
												<img src='' alt='' />
											))}
										</div>
									) : (
										""
									)}
								</InputRightElement>
							</InputGroup>
						</FormControl>
					</Box>
				</>
			) : (
				<Box
					display='flex'
					alignItems='center'
					justifyContent='center'
					h='100%'
				>
					<Text fontSize='3xl' pb={3} fontFamily='Work sans'>
						Click on a user to start chatting
					</Text>
				</Box>
			)}
		</>
	);
};

export default SingleChat;
