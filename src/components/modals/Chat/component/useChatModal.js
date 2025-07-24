import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { connectSocket, emitSocketEvent, listenSocketEvent } from "../../../../store/slices/userSlice";
import { chatApi } from "../../../../services/apiService";
import { handleError, withErrorHandling } from "../../../../utils/errorHandler";

export const useChatModal = (idService) => {
  const dispatch = useDispatch();
  const { user, socketConnected } = useSelector((state) => state.user);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messageHandlerRef = useRef(null);

  useEffect(() => {
    // Only proceed if we have a valid service ID
    if (!idService) {
      console.log("No service ID provided, skipping chat setup");
      return;
    }

    // Setup function to initialize chat
    const setupChat = async () => {
      // Make sure socket is connected first
      if (!socketConnected) {
        dispatch(connectSocket());
      }

      // Join the correct room for this service
      const room = `service-request-${idService}`;
      console.log(`Joining chat room: ${room}`);
      dispatch(emitSocketEvent("join", { room }));
      setIsConnected(true);

      // Set up listener for incoming messages
      const messageHandler = (messages) => {
        console.log("messageHandler received: ", messages);
        if (messages) {
          handleIncomingMessage(messages);
        } else {
          console.warn("Received empty message in messageHandler");
        }
      };
      
      // Store the message handler in a ref so we can access it in the cleanup function
      messageHandlerRef.current = messageHandler;
      
      // Listen for message events
      dispatch(listenSocketEvent("message", messageHandler));

      // Fetch previous messages from the backend
      await fetchMessages(idService);
    };

    // Initialize chat
    setupChat();
    
    // Clean up function - runs when component is unmounted or idService changes
    return () => {
      console.log("Closing chat room");
    };
  }, [socketConnected, idService, dispatch]);

  // Function to fetch previous messages from the backend
  const fetchMessages = async (idService) => {
    if (!idService) {
      console.warn("Cannot fetch messages: No service ID provided");
      return;
    }
    
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
    if (!newMessage.trim()) return; // Don't send empty messages
    if (!idService) {
      console.warn("Cannot send message: No service ID provided");
      return;
    }
    
    console.log("Sending message:", newMessage, "from user:", user.id, "to service:", idService);
    
    // Ensure socket is connected before trying to emit messages
    if (!socketConnected) {
      console.warn("Socket not connected. Trying to connect...");
      dispatch(connectSocket());
      // We'll let the middleware handle retrying the emit after connection
    }
    
    // Emit the new message via WebSocket to the backend for real-time updates
    dispatch(emitSocketEvent("message", {
      chatRoomId: idService,
      text: newMessage,
      sender: user.id,
    }));

    // After sending the message, add it to the 'messages' state to update the chat screen instantly.
    setMessages((prevData) => [...prevData,
      { message: { sender: user.id, message: newMessage } },
    ]);

    setNewMessage("");
  };

  // Function to handle incoming messages via WebSocket
  const handleIncomingMessage = (incoming_messages) => {
    console.log("Processing incoming message: ", incoming_messages);
    
    try {
      // The server sends the entire messages array
      if (Array.isArray(incoming_messages)) {
        console.log("Received messages array from server");
        // Format messages correctly for display
        const formattedMessages = incoming_messages.map(msg => {
          // Make sure the message has the expected structure
          if (msg && msg.message) {
            return msg;
          }
          return null;
        }).filter(msg => msg !== null);
        
        console.log("Setting formatted messages:", formattedMessages);
        setMessages(formattedMessages);
      } else {
        console.warn("Unexpected message format, expected array:", incoming_messages);
      }
    } catch (error) {
      console.error("Error processing incoming message:", error);
    }
  };

  const handleMessageChange = (text) => {
    setNewMessage(text);
  };

  // Function to manually disconnect from the chat room
  const disconnectFromChat = () => {
    if (isConnected && idService) {
      const room = `service-request-${idService}`;
      console.log(`Manually leaving chat room: ${room}`);
      
      // Remove message listener
      dispatch({ type: 'socket/unlisten', payload: { event: 'message' } });
      
      // Leave the room
      dispatch(emitSocketEvent("leave", { room }));
      
      setIsConnected(false);
    }
  };

  return {
    models: {
      messages,
      newMessage,
      user,
      isConnected,
    },
    operations: {
      fetchMessages,
      sendMessage,
      handleMessageChange,
      disconnectFromChat,
    },
  };
};
