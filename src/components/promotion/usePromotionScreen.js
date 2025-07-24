import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { activateDiscountCode } from "../../store/slices/userSlice";

export const usePromotionScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [code, setCode] = useState("");

  const onCodeTextChange = (input) => {
    setCode(input)
  }

  const handleActivateCode = () => {
    dispatch(activateDiscountCode({ userId: user.id, code }));
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
