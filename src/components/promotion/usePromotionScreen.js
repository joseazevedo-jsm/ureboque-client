import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { useForm } from "../../hooks/useForm";
import { Alert } from "react-native";

export const usePromotionScreen = () => {

  const { socket, user, fetchUserById, activateDiscount } = useContext(UserContext);
  const [activationError, setActivationError] = useState(null);
  
  // Form validation for promotion code
  const promoForm = useForm(
    { code: "" },
    {
      code: [
        {
          validator: (value) => value && value.trim().length > 0,
          message: "Código promocional é obrigatório"
        },
        {
          validator: (value) => value && value.length >= 3,
          message: "Código promocional deve ter pelo menos 3 caracteres"
        },
        {
          validator: (value) => value && value.length <= 20,
          message: "Código promocional deve ter menos de 20 caracteres"
        },
        {
          validator: (value) => value && /^[A-Za-z0-9]+$/.test(value),
          message: "Código promocional só pode conter letras e números"
        }
      ]
    }
  );

  const onCodeTextChange = (input) => {
    promoForm.setValue("code", input);
    // Clear activation error when user starts typing
    if (activationError) {
      setActivationError(null);
    }
  }

  const handleActivateCode = async () => {
    const isValid = promoForm.validate();
    
    if (!isValid) {
      // Show validation error
      const codeError = promoForm.errors.code;
      if (codeError) {
        setActivationError(codeError);
        throw new Error(codeError);
      }
    }
    
    try {
      // Clear any previous error
      setActivationError(null);
      
      // Proceed with activation if validation passes
      await activateDiscount(promoForm.values.code);
      return { success: true };
    } catch (error) {
      setActivationError(error.message);
      throw error;
    }
  }

  return {
    models: {
      user,
      code: promoForm.values.code,
      codeError: activationError || promoForm.errors.code,
      promoForm
    },
    operations: {
        handleActivateCode,
        onCodeTextChange
    },
  };
};
