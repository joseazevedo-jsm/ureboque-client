import axios from "axios";
import { useRef, useState } from "react";

const api = axios.create({
  baseURL: "http://192.168.0.176:9000/users",
});

export const useRegisterModal = (OTPChange) => {
  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);
  const inputRef3 = useRef(null);
  const inputRef4 = useRef(null);

  const [modalRegisterInfoVisible, setModalRegisterInfoVisible] =
    useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [surname, setSurname] = useState("");

  const [errors, setErrors] = useState([]);
  const [errorsUser, setErrorsUser] = useState([]);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);

  const validationRules = [
    {
      key: "length",
      rule: password.length >= 8,
      message: "Pelo menos 8 caracteres",
    },
    {
      key: "uppercase",
      rule: /[A-Z]/.test(password),
      message: "Pelo menos uma letra maiúscula",
    },
    {
      key: "lowercase",
      rule: /[a-z]/.test(password),
      message: "Pelo menos uma letra minúscula",
    },
    {
      key: "number",
      rule: /\d/.test(password),
      message: "Pelo menos um número",
    },
    {
      key: "specialChar",
      rule: /[@$!%*?&]/.test(password),
      message: "Pelo menos um caractere especial",
    },
    {
      key: "match",
      rule: password === confirmPassword,
      message: "As senhas não coincidem",
    },
  ];

  const validationRulesUser = [
    { key: "name", value: name, message: "Nome é obrigatório" },
    { key: "surname", value: surname, message: "Sobrenome é obrigatório" },
    { key: "email", value: email, message: "Email é obrigatório" },
    { key: "email", value: email.includes("@"), message: "Email inválido" },
  ];

  const onPasswordTextChange = (input) => {
    setPassword(input);
  };

  const onConfirmPasswordTextChange = (input) => {
    setConfirmPassword(input);
  };

  const validatePassword = () => {
    const newErrors = validationRules
      .filter((rule) => !rule.rule)
      .map((rule) => rule.message);
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const onNameTextChange = (input) => {
    setName(input);
  };

  const onEmailTextChange = (input) => {
    setEmail(input);
  };

  const onSurnameTextChange = (input) => {
    setSurname(input);
  };

  const validateRegistrationUser = () => {
    const newErrors = validationRulesUser
      .filter((rule) => !rule.value)
      .map((rule) => rule.message);
    setErrorsUser(newErrors);
    return newErrors.length === 0;
  };

  const handleCreateUser = async (phone) => {
    try {
      if (validateRegistrationUser()) {
        console.log(password, name, email, surname, phone);
        const result = await api.post("/register", {
          password: password,
          details: {
            name: name,
            surname: surname,
          },
          email: email,
          phone: phone,
        });

        const data = result.data;
        console.log("--> ", data);

        if (data) {
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleOnGoModalRegisterInfoVisible = () => {
    if (validatePassword())
      if (password === confirmPassword) {
        setModalRegisterInfoVisible(true);
      }
  };

  const handleOTPInputChange = (text, index) => {
    OTPChange(text);

    switch (index) {
      case 1:
        if (text.length === 1) {
          inputRef2.current.focus();
        }
        break;
      case 2:
        if (text.length === 1) {
          inputRef3.current.focus();
        } else if (text.length === 0) {
          inputRef1.current.focus();
          inputRef2.current.clear();
        }
        break;
      case 3:
        if (text.length === 1) {
          inputRef4.current.focus();
        } else if (text.length === 0) {
          inputRef2.current.focus();
          inputRef3.current.clear();
        }
        break;
      case 4:
        if (text.length === 0) {
          inputRef3.current.focus();
          inputRef4.current.clear();
        }
        break;
      default:
        break;
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    
    // Handle backspace
    if (text === '') {
      newOtp[index] = '';
      setOtp(newOtp);
      // Move to previous input when backspace is pressed
      if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
      return;
    }

    // Only allow numbers
    if (!/^\d+$/.test(text)) {
      return;
    }

    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus logic
    if (text.length === 1 && index < 3) {
      inputRefs.current[index + 1].focus();
    }
    
    // Verify OTP if all digits are entered
    if (text.length === 1 && index === 3) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 4) {
        OTPChange(fullOtp);
      }
    }
  };

   // CHANGE TO INDIVIDUAL PACKAGES
  const handleResend = () => {
    resendOTP(); // Call the function passed from the parent component
  };

  return {
    models: {
      modalRegisterInfoVisible,
      errors,
      errorsUser,
      inputRef1,
      inputRef2,
      inputRef3,
      inputRef4,
      otp,
      inputRefs,
    },
    operations: {
      handleOnGoModalRegisterInfoVisible,
      onPasswordTextChange,
      onConfirmPasswordTextChange,
      onNameTextChange,
      onEmailTextChange,
      onSurnameTextChange,
      handleCreateUser,
      handleOTPInputChange,
      handleResend,
      handleOtpChange,
    },
  };
};
