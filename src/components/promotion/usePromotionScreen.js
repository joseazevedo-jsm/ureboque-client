import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext";

export const usePromotionScreen = () => {

  const { socket, user, fetchUserById, activateDiscount } = useContext(UserContext);
  const [code, setCode] = useState("");

  const onCodeTextChange = (input) => {
    setCode(input)
  }

  const handleActivateCode = () => {
    activateDiscount(code)
  }

  return {
    models: {
      user
    },
    operations: {
        handleActivateCode,
        onCodeTextChange
    },
  };
};
