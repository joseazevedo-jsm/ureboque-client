import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { useForm } from "../../hooks/useForm";
import { Alert } from "react-native";

export const usePromotionScreen = () => {

  const { socket, user, fetchUserById, activateDiscount } = useContext(UserContext);
  
  // Form validation for promotion code
  const promoForm = useForm(
    { code: "" },
    {
      code: [
        {
          validator: (value) => value && value.trim().length > 0,
          message: "Promotion code is required"
        },
        {
          validator: (value) => value && value.length >= 3,
          message: "Promotion code must be at least 3 characters"
        },
        {
          validator: (value) => value && value.length <= 20,
          message: "Promotion code must be less than 20 characters"
        },
        {
          validator: (value) => value && /^[A-Za-z0-9]+$/.test(value),
          message: "Promotion code can only contain letters and numbers"
        }
      ]
    }
  );

  const onCodeTextChange = (input) => {
    promoForm.setValue("code", input);
  }

  const handleActivateCode = () => {
    const isValid = promoForm.validate();
    
    if (!isValid) {
      // Show validation error
      const codeError = promoForm.errors.code;
      if (codeError) {
        Alert.alert("Invalid Code", codeError);
        return;
      }
    }
    
    // Proceed with activation if validation passes
    activateDiscount(promoForm.values.code);
  }

  return {
    models: {
      user,
      code: promoForm.values.code,
      codeError: promoForm.errors.code,
      promoForm
    },
    operations: {
        handleActivateCode,
        onCodeTextChange
    },
  };
};
