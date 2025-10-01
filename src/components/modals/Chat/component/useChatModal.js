import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../../context/UserContext";
import { useLogger } from "../../../../hooks/useLogger";
import api from "../../../../services/APIService";
export const useChatModal = (idService, setUnreadMessageCount) => {
  const logger = useLogger('useChatModal');
  const { user, socket } = useContext(UserContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Clear messages when service ID changes (new service)
    logger.info('Chat service changed, clearing old messages', { idService });
    setMessages([]);

    // Fetch previous messages from the backend when the chat screen is opened
    if (idService) {
      fetchMessages(idService);
    }

    // Listen for incoming messages via WebSocket and update the chat screen
    if (socket) {
      socket.on("message", (messages) => {
        handleIncomingMessage(messages);
      });
    }
    return () => {
      // Clean up the socket event listener when the component is unmounted
      if (socket) {
        socket.off("message", handleIncomingMessage);
      }
    };
  }, [socket, idService]);

  // Function to fetch previous messages from the backend
  const fetchMessages = async (idService) => {
    try {
      logger.info('Fetching messages for service', { idService });
      const response = await api.get(`/chats/${idService}`);
      logger.info('Previous messages fetched', {
        idService,
        messageCount: response.data.messages?.length,
        firstMessageId: response.data.messages?.[0]?._id
      });
      const data = await response.data;
      if(data) {
        setMessages(data.messages);
      }
    } catch (error) {
      logger.error('Error fetching chat messages', { idService, error });
    }
  };

  // Function to send a new message
  const sendMessage = () => {
    if (!socket) {
      logger.warn('Socket not connected, cannot send message');
      return;
    }

    logger.info('Sending chat message', { hasMessage: !!newMessage, userId: user.id, serviceId: idService });
    // Emit the new message via WebSocket to the backend for real-time updates
    socket.emit("message", {
      chatRoomId: idService,
      text: newMessage,
      sender: user.id,
    });

    // After sending the message, add it to the 'messages' state to update the chat screen instantly.
    setMessages((prevData) => [...prevData,
      { message: { sender: user.id, message: newMessage, createdAt: new Date().toISOString() } },
    ]);

    setNewMessage("");
  };

  // Function to handle incoming messages via WebSocket
  const handleIncomingMessage = (incoming_messages) => {
    logger.info('Incoming chat messages received', { messageCount: incoming_messages?.length });
    
    // When chat is open, just update messages - unread count is handled by global listener when chat is closed
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
