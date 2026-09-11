import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../../../context/UserContext";
import { useLogger } from "../../../../hooks/useLogger";
import api from "../../../../services/APIService";
export const useChatModal = (idService, setUnreadMessageCount) => {
  const logger = useLogger('useChatModal');
  const { user, socket } = useContext(UserContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const requestGenerationRef = useRef(0);

  const normalizeMessages = useCallback((payload) => (
    (Array.isArray(payload) ? payload : payload?.messages || []).filter(msg => msg?.message)
  ), []);

  const handleIncomingMessage = useCallback((incomingMessages) => {
    const nextMessages = normalizeMessages(incomingMessages);
    logger.info('Incoming chat messages received', { messageCount: nextMessages?.length });
    setMessages(nextMessages);
  }, [logger, normalizeMessages]);

  // Function to fetch previous messages from the backend
  const fetchMessages = useCallback(async (idService) => {
    const requestGeneration = requestGenerationRef.current;
    try {
      logger.info('Fetching messages for service', { idService });
      const response = await api.get(`/chats/${idService}`);
      logger.info('Previous messages fetched', {
        idService,
        messageCount: response.data?.messages?.length,
        firstMessageId: response.data?.messages?.[0]?._id
      });
      const data = response.data;
      if (data && requestGeneration === requestGenerationRef.current) {
        setMessages(normalizeMessages(data.messages));
      }
    } catch (error) {
      logger.error('Error fetching chat messages', { idService, error });
    }
  }, [logger, normalizeMessages]);

  useEffect(() => {
    requestGenerationRef.current += 1;
    // Clear messages when service ID changes (new service)
    logger.info('Chat service changed, clearing old messages', { idService });
    setMessages([]);

    // Fetch previous messages from the backend when the chat screen is opened
    if (idService) {
      fetchMessages(idService);
    }

    // Listen for incoming messages via WebSocket and update the chat screen
    if (socket) {
      const messageHandler = (messages, meta = {}) => {
        if (meta.chatRoomId && meta.chatRoomId !== idService) return;
        handleIncomingMessage(messages);
      };
      socket.on("message", messageHandler);
      return () => {
        requestGenerationRef.current += 1;
        socket.off("message", messageHandler);
      };
    }
    return () => { requestGenerationRef.current += 1; };
  }, [socket, idService, fetchMessages, handleIncomingMessage, logger]);

  // Function to send a new message
  const sendMessage = useCallback(() => {
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
  }, [idService, logger, newMessage, socket, user?.id]);

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
