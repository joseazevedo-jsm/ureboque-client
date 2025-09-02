import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext";
import axios from "axios";
import { useLogger } from '../../hooks/useLogger';

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API; //attt ao apagar

export const useInviteScreen = () => {
  const logger = useLogger('useInviteScreen');

  const { user } = useContext(UserContext);
  const [ inviteCode, setInviteCode] = useState();


  useEffect(() => {
    handleGetInviteCode();
  }, []);
  

  const handleGetInviteCode = async () => {
    try {
      logger.debug("API endpoint", { IP });
      const response = await axios.get(
        `${IP}/promotions/user/${user.id}`
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
