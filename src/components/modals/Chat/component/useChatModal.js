import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../../context/UserContext";
import axios from "axios";

const api = axios.create({
  baseURL:  process.env.EXPO_PUBLIC_UREBOQUE_API
});
export const useChatModal = (idService) => {
  const { user, socket } = useContext(UserContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Fetch previous messages from the backend when the chat screen is opened
    fetchMessages(idService);

    // Listen for incoming messages via WebSocket and update the chat screen
    socket.on("message", (messages) => {
      handleIncomingMessage(messages);
    });
    // return () => {
    //   // Clean up the socket event listener when the component is unmounted
    //   socket.off("message", handleIncomingMessage);
    // };
  }, []);

  // Function to fetch previous messages from the backend
  const fetchMessages = async (idService) => {
    try {
      const response = await api.get(`/chats/${idService}`);
      console.log("OLD:", response.data.messages);
      const data = await response.data;
      if(data)
        setMessages(data.messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Function to send a new message
  const sendMessage = () => {

    console.log("CHAT: ", newMessage, user.id, idService);
    // Emit the new message via WebSocket to the backend for real-time updates
    socket.emit("message", {
      chatRoomId: idService,
      text: newMessage,
      sender: user.id,
    });

    // After sending the message, add it to the 'messages' state to update the chat screen instantly.
    setMessages((prevData) => [...prevData,
      { message: { sender: user.id, message: newMessage } },
    ]);

    setNewMessage("");
  };

  // Function to handle incoming messages via WebSocket
  const handleIncomingMessage = (incoming_messages) => {
    console.log("MSG: ", incoming_messages);
    setMessages(incoming_messages);
  };

  return {
    models: {
      messages,
      newMessage,
      user,
    },
    operations: {
      fetchMessages,
      sendMessage,
      setNewMessage,
    },
  };
};
