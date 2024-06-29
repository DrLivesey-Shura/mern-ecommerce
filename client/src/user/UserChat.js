import React, { useState, useEffect, useRef } from "react";
import { Box, VStack, HStack, Text } from "@chakra-ui/react";
import Layout from "../core/Layout";

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const websocket = useRef(null);
  const jwt = JSON.parse(localStorage.getItem("jwt"));
  const user = jwt.user.username;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    websocket.current = new WebSocket(`ws://localhost:8000/ws/${user}`);

    websocket.current.onopen = () => {
      console.log("Connected to WebSocket");
    };

    websocket.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    websocket.current.onclose = () => {
      console.log("Disconnected from WebSocket");
    };

    return () => {
      websocket.current.close();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // useEffect(() => {
  //   fetchMessages();
  // }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:8000/messages/${user}`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error.message);
    }
  };

  const sendMessage = () => {
    if (inputValue.trim() && websocket.current.readyState === WebSocket.OPEN) {
      const message = {
        recipient: "admin",
        message: inputValue,
      };
      websocket.current.send(JSON.stringify(message));

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: user, recipient: "admin", message: inputValue },
      ]);
      websocket.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, message]);
      };

      setInputValue("");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
            {messages.map((msg, index) => (
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
                  <Text m={5}>{msg.message}</Text>
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
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
