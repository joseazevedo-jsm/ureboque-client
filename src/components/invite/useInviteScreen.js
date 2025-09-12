import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { useLogger } from '../../hooks/useLogger';
import api from "../../services/APIService";

export const useInviteScreen = () => {
  const logger = useLogger('useInviteScreen');

  const { user } = useContext(UserContext);
  const [inviteCode, setInviteCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      handleGetInviteCode();
    }
  }, [user?.id]);
  
  const handleGetInviteCode = async () => {
    if (!user?.id) {
      logger.warn("Cannot fetch invite code: user ID not available");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug("Getting invite code for user", { userId: user.id });
      const response = await api.get(`/promotions/user/${user.id}`);
      setInviteCode(response.data.code);
      logger.info("Invite code retrieved successfully", { code: response.data.code });
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || error.message;
      
      logger.error("Failed to get invite code", { 
        statusCode, 
        errorMessage, 
        userId: user.id 
      });
      
      if (statusCode === 404) {
        setError("Invite code not found. Please contact support.");
      } else if (statusCode >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Failed to load invite code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retryGetInviteCode = () => {
    handleGetInviteCode();
  };

  return {
    models: {
      user,
      inviteCode,
      isLoading,
      error
    },
    operations: {
      retryGetInviteCode
    },
  };
};
