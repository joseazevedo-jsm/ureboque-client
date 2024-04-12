import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext";
import axios from "axios";

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API; //attt ao apagar

export const useInviteScreen = () => {

  const { user } = useContext(UserContext);
  const [ inviteCode, setInviteCode] = useState();


  useEffect(() => {
    handleGetInviteCode();
  }, []);
  

  const handleGetInviteCode = async () => {
    try {
        console.log(IP)
      const response = await axios.get(
        `${IP}/promotions/user/${user.id}`
      );
      setInviteCode(response.data.code);
      console.log(response.data);
    } catch (error) {
      console.log(error.response.data.error);
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
