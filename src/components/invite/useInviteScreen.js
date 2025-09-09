import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { useLogger } from '../../hooks/useLogger';
import api from "../../services/APIService";

export const useInviteScreen = () => {
  const logger = useLogger('useInviteScreen');

  const { user } = useContext(UserContext);
  const [ inviteCode, setInviteCode] = useState();


  useEffect(() => {
    handleGetInviteCode();
  }, []);
  

  const handleGetInviteCode = async () => {
    try {
      logger.debug("Getting invite code for user", { userId: user.id });
      const response = await api.get(
        `/promotions/user/${user.id}`
      );
      setInviteCode(response.data.code);
      logger.info("Invite code retrieved", response.data);
    } catch (error) {
      logger.error("Failed to get invite code", error.response?.data?.error || error.message);
    }
  }
  return {
    models: {
      user,
      inviteCode
    },
    operations: {
    },
  };
};
