import React, { useState, useEffect } from "react";
import {
  Box,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  Select,
  Flex,
  Avatar,
  Heading,
  Container,
} from "@chakra-ui/react";
import "./ChatStyle.css";
import Layout from "../core/Layout";

const AdminChatComponent = () => {
  const [ws, setWs] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    fetchMessages();
    const socket = new WebSocket(`ws://localhost:8000/ws/admin`);

    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, data]);
    };

    socket.onclose = () => {
      console.log("Disconnected from WebSocket");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const fetchMessages = async () => {
    const response = await fetch("http://localhost:8000/admin/messages");
    const data = await response.json();
    setMessages(data);
  };

  const sendMessage = () => {
    if (ws && message && selectedUser) {
      ws.send(JSON.stringify({ recipient: selectedUser, message }));
      setMessage("");
    }
  };

  const uniqueUsers = [...new Set(messages.map((msg) => msg.sender))];

  return (
    <Layout title="Admin Chat" description={""} className="container-fluid">
      <Container
        borderColor="#2980b9"
        boxShadow="0 0 15px rgba(52, 152, 219, 0.5)"
        p="20px"
        borderRadius="12px"
        bgColor="whitesmoke"
        m="20px"
      >
        <Select
          width="50%"
          borderRadius="8px"
          borderColor="#2980b9"
          boxShadow="0 0 15px rgba(52, 152, 219, 0.5)"
          p="12px"
          fontSize="18px"
          placeholder="Select User"
          onChange={(e) => setSelectedUser(e.target.value)}
          mb={4}
        >
          {uniqueUsers.map((user, index) => (
            <option style={{ padding: "12px" }} key={index} value={user}>
              {user}
            </option>
          ))}
        </Select>
        <Flex
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
                msg.sender === selectedUser || msg.recipient === selectedUser
            )
            .map((msg, index) => (
              <HStack
                key={index}
                justify={msg.sender === "admin" ? "flex-end" : "flex-start"}
                my={2}
              >
                <Box
                  bg={msg.sender === "admin" ? "#2196F3" : "#E0E0E0"}
                  color="black"
                  p={8}
                  borderRadius="16px"
                  maxW="100%"
                >
                  <Text fontSize="16px" m={3}>
                    {msg.message}
                  </Text>
                </Box>
              </HStack>
            ))}
        </Flex>
        <HStack>
          {/* <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          flex={1}
        /> */}
          <input
            placeholder="Type something..."
            class="input"
            name="text"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {/* <Button onClick={sendMessage} colorScheme="blue">
          Send
        </Button> */}
          <button class="sendbtn" onClick={sendMessage}>
            <div class="svg-wrapper-1">
              <div class="svg-wrapper">
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
      </Container>
    </Layout>
  );
};

export default AdminChatComponent;
