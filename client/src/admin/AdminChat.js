import React, { useState, useEffect, useRef } from "react";
import { Box, VStack, HStack, Text, Flex, Container } from "@chakra-ui/react";
import "./ChatStyle.css";
import Layout from "../core/Layout";

const AdminChatComponent = () => {
  const [ws, setWs] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const socket = new WebSocket(`ws://localhost:8000/ws/admin`);

    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, data]);
      setUniqueUsers((prevUsers) => getUniqueUsers([...prevUsers, data]));
    };

    socket.onclose = () => {
      console.log("Disconnected from WebSocket");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
    // fetchMessages();
  }, [messages]);

  useEffect(() => {
    fetchMessages();
  }, [selectedUser]);

  const fetchMessages = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch("http://localhost:8000/admin/messages");
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      setMessages(data);
      setUniqueUsers(getUniqueUsers(data));
    } catch (error) {
      console.error("Error fetching messages:", error.message);
    }
  };

  const sendMessage = () => {
    if (ws && message && selectedUser) {
      const msg = { recipient: selectedUser, message };
      ws.send(JSON.stringify(msg));

      // Update local state with the sent message
      const sentMessage = {
        sender: "admin",
        recipient: selectedUser,
        message,
      };
      setMessages((prevMessages) => [...prevMessages, sentMessage]);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, data]);
        setUniqueUsers((prevUsers) => getUniqueUsers([...prevUsers, data]));
      };

      setMessage("");
    }
  };

  const getUniqueUsers = (messages) => {
    const users = messages
      .map((msg) => msg.sender)
      .filter((user) => user !== "admin");
    return [...new Set(users)];
  };

  const getLastMessage = (user) => {
    const userMessages = messages.filter(
      (msg) => msg.sender === user || msg.recipient === user
    );
    const lastMessage = userMessages[userMessages.length - 1];
    if (!lastMessage) return "";
    const prefix = lastMessage.sender === "admin" ? "You: " : "";
    return `${prefix}${lastMessage.message}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
        <Flex>
          <Box
            w="30%"
            borderRight="1px solid #2980b9"
            p={4}
            overflowY="auto"
            maxH="60vh"
            mr={18}
          >
            <VStack spacing={4} align="stretch">
              {uniqueUsers.map((user, index) => (
                <Box
                  my={8}
                  mx={4}
                  key={index}
                  p={8}
                  bg={selectedUser === user ? "#2980b9" : "white"}
                  color={selectedUser === user ? "white" : "black"}
                  borderRadius="12px"
                  cursor="pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <Text fontSize={18} fontWeight="bold">
                    {user}
                  </Text>
                  <Text fontSize="sm">{getLastMessage(user)}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
          <Flex direction="column" w="70%" p={4}>
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
                    msg.sender === selectedUser ||
                    msg.recipient === selectedUser
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
              <div ref={messagesEndRef} />{" "}
            </Flex>
            <HStack>
              <input
                placeholder="Type something..."
                className="input"
                name="text"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
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
          </Flex>
        </Flex>
      </Container>
    </Layout>
  );
};

export default AdminChatComponent;
