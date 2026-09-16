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
    const text = newMessage?.trim();
    if (!text) return;
    if (!socket) {
      logger.warn('Socket not connected, cannot send message');
      return;
    }

    logger.info('Sending chat message', { hasMessage: !!text, userId: user.id, serviceId: idService });

    // The optimistic bubble starts as 'pending' and is only promoted to 'sent'
    // when the server acknowledges the write. socket.io silently buffers an
    // emit on a dead socket, so without this a message composed with no
    // connection was drawn exactly like a delivered one and quietly lost —
    // the user had every reason to think the driver had read it.
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMessages((prevData) => [...prevData, {
      localId,
      deliveryStatus: 'pending',
      message: { sender: user.id, message: text, createdAt: new Date().toISOString() },
    }]);
    setNewMessage("");

    const settle = (deliveryStatus) => setMessages((prevData) => prevData.map(
      (entry) => (entry.localId === localId ? { ...entry, deliveryStatus } : entry)
    ));

    socket.timeout(10000).emit("message", {
      chatRoomId: idService,
      text,
      sender: user.id,
    }, (error, response) => {
      settle(!error && response?.success !== false ? 'sent' : 'failed');
    });
  }, [idService, logger, newMessage, socket, user?.id]);

  // Lets the user retry a message that never reached the server.
  const retryMessage = useCallback((localId) => {
    const entry = messages.find((item) => item.localId === localId);
    if (!entry || !socket) return;
    setMessages((prevData) => prevData.map(
      (item) => (item.localId === localId ? { ...item, deliveryStatus: 'pending' } : item)
    ));
    socket.timeout(10000).emit("message", {
      chatRoomId: idService,
      text: entry.message.message,
      sender: user.id,
    }, (error, response) => {
      setMessages((prevData) => prevData.map((item) => (item.localId === localId
        ? { ...item, deliveryStatus: !error && response?.success !== false ? 'sent' : 'failed' }
        : item)));
    });
  }, [idService, messages, socket, user?.id]);

  return {
    models: {
      messages,
      newMessage,
      user,
    },
    operations: {
      fetchMessages,
      sendMessage,
      retryMessage,
      setNewMessage,
    },
  };
};
