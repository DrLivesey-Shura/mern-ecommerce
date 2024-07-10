import React, { useState, useEffect, useRef } from "react";
import { Box, VStack, HStack, Text } from "@chakra-ui/react";
import Layout from "../core/Layout";
import "../admin/ChatStyle.css";

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const messageEndRef = useRef(null);
  const jwt = JSON.parse(localStorage.getItem("jwt"));
  const username = jwt.user.username;
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const recipient = "admin";
  useEffect(() => {
    try {
      ws.current = new WebSocket(`ws://localhost:8000/ws/${username}`);

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("DATA : ", data);
          setMessages((prevMessages) => [...prevMessages, data]);
        } catch (e) {
          console.log(event.data);
          console.error(e);
        }
      };

      return () => {
        ws.current.onmessage = null;
        ws.current.close();
      };
    } catch (e) {
      console.log("Failed to connect to websocket");
    }
  }, [username]);

  const sendMessage = () => {
    if (messageInput.trim() === "") return;

    const message = {
      sender: username,
      recipient: recipient,
      content: messageInput,
    };

    ws.current.send(JSON.stringify(message));
    setMessageInput("");
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Layout title="Chat" description="" className="container-fluid">
      <Box
        borderColor="#2980b9"
        boxShadow="0 0 15px rgba(52, 152, 219, 0.5)"
        p="20px"
        borderRadius="12px"
        bgColor="whitesmoke"
        m="12px"
      >
        <VStack spacing={4} align="stretch">
          <Box
            direction="column"
            flex={1}
            overflowY="auto"
            mb={4}
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            shadow="md"
            maxH="60vh"
          >
            {messages
              .filter(
                (msg) =>
                  (msg.sender === username && msg.recipient === "admin") ||
                  (msg.sender === "admin" && msg.recipient === username)
              )
              .map((msg, index) => (
                <HStack
                  key={index}
                  justify={msg.sender === "admin" ? "flex-start" : "flex-end"}
                  my={2}
                >
                  <Box
                    bg={msg.sender === "admin" ? "#E0E0E0" : "#2196F3"}
                    color="black"
                    px={13}
                    borderRadius="12px"
                    maxW="100%"
                  >
                    <Text m={5}>{msg.content}</Text>
                  </Box>
                </HStack>
              ))}
            <div ref={messagesEndRef} />{" "}
          </Box>
          <HStack>
            <input
              placeholder="Type something..."
              className="input"
              name="text"
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="sendbtn" onClick={sendMessage}>
              <div className="svg-wrapper-1">
                <div className="svg-wrapper">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <path fill="none" d="M0 0h24v24H0z"></path>
                    <path
                      fill="currentColor"
                      d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                    ></path>
                  </svg>
                </div>
              </div>
              <span>Send</span>
            </button>
          </HStack>
        </VStack>
      </Box>
    </Layout>
  );
};

export default ChatComponent;
