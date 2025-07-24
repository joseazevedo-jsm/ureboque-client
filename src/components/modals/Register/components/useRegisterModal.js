import axios from "axios";
import { useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API; //attt ao apagar

const api = axios.create({
  baseURL: `${IP}/users`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add new API endpoints for OTP
const sendOTP = async (contact, type) => {
  try {
    const response = await api.post('/send-otp', {
      [type]: contact // will be either { email: contact } or { phone: contact }
    });
    console.log('-->', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

const verifyOTP = async (contact, type, otp) => {
  try {
    const response = await api.post('/verify-otp', {
      [type]: contact, // will be either { email: contact } or { phone: contact }
      otp
    });
    console.log('-->', response.data);
    return response.data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

export const useRegisterModal = (OTPChange, onClosePassModal, onRegistrationComplete) => {
  const navigation = useNavigation();
  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);
  const inputRef3 = useRef(null);
  const inputRef4 = useRef(null);

  const [modalRegisterInfoVisible, setModalRegisterInfoVisible] =
    useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [surname, setSurname] = useState("");
   const [errors, setErrors] = useState([]);
  const [errorsUser, setErrorsUser] = useState([]);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);

  const [isLoading, setIsLoading] = useState(false);

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
      message: "As senhas devem coincidir",
    },
  ];

  const onPasswordTextChange = (input) => {
    setPassword(input);
    validatePassword();
  };

  const onConfirmPasswordTextChange = (input) => {
    setConfirmPassword(input);
    validatePassword();
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

  const validateRegistrationUser = (registrationMethod, tempPhone = null) => {
    const newErrors = [];
    
    // Common validations for both methods
    if (!name || name.trim().length < 2) {
      newErrors.push("Nome deve ter pelo menos 2 caracteres");
    }
    if (!surname || surname.trim().length < 2) {
      newErrors.push("Sobrenome deve ter pelo menos 2 caracteres");
    }

    // Method-specific validations
    if (registrationMethod === 'email') {
      if (!email) {
        newErrors.push("Email é obrigatório");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        newErrors.push("Email inválido");
      }
    } else if (registrationMethod === 'phone') {
      if (!tempPhone) {
        newErrors.push("Número de telefone é obrigatório");
      }
    }

    setErrorsUser(newErrors);
    return newErrors.length === 0;
  };

  const handleCreateUser = async (phone, registrationMethod) => {
    setIsLoading(true);
    try {
      // Validate based on registration method
      if (!validateRegistrationUser(registrationMethod, phone)) {
        return false;
      }

      const userData = {
        password,
        details: {
          name: name.trim(),
          surname: surname.trim(),
        },
        [registrationMethod]: registrationMethod === 'email' ? email.trim() : phone,
      };
      console.log('userData', userData);

      if (registrationMethod === 'email') {
        // For email registration, first store the data and send OTP
        if (!registrationData) {
          setRegistrationData({...userData, registrationType: 'email'});
          try {
            await handleSendOTP('email');
            setOtpModalVisible(true);
            console.log('OTP modal visible');
            return true;
          } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('already registered')) {
              setErrorsUser(['Este email já está registrado']);
            } else {
              setErrorsUser([error.response?.data?.message || 'Error sending OTP']);
            }
            setRegistrationData(null);
            return false;
          }
        } else {
          // If we already have registration data, just show the OTP modal
          setOtpModalVisible(true);
          return true;
        }
      } else if (registrationMethod === 'phone') {
        // For phone registration, create user directly after info collection
        console.log('DEBUG - Creating user with phone data:', userData);
        const result = await api.post("/register", userData);
        
        if (result.data) {
          console.log('DEBUG - User created successfully');
          clearFormData();
          setModalRegisterInfoVisible(false);
          
          // First call onRegistrationComplete, then onChangeLoginState
          console.log('DEBUG - Completing registration and transitioning to login');
          onRegistrationComplete('phone', phone);
          
          return true;
        }
      }
      return false;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar usuário';
      setErrorsUser([errorMessage]);
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearFormData = () => {
    setName("");
    setSurname("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrorsUser([]);
  };

  const handleOnGoModalRegisterInfoVisible = () => {
    if (validatePassword()) {
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
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleSendOTP = async (registrationMethod) => {
    try {
      const contact = registrationMethod === 'email' ? email.trim() : phone;
      
      // Don't send OTP if we already have registration data and OTP was sent
      if (registrationMethod === 'email' && registrationData) {
        console.log('OTP already sent, skipping send');
        return true;
      }
      
      const response = await sendOTP(contact, registrationMethod);
      return response;
    } catch (error) {
      console.error('Error in handleSendOTP:', error);
      throw error;
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    try {
      setIsLoading(true);
      console.log('DEBUG - Verifying OTP for registration');
      
      // Get the contact and type based on registration method
      const type = registrationData?.registrationType || 'phone';
      const contact = registrationData ? registrationData[type] : phone;
      
      console.log('DEBUG - Verifying OTP for:', { type, contact });
      const verified = await verifyOTP(contact, type, otpCode);
      
      if (verified) {
        if (registrationData) {
          // For email flow - create user after OTP verification
          console.log('DEBUG - Creating user with data:', registrationData);
          const result = await api.post("/register", registrationData);
          console.log("DEBUG - User created", result.data);
          if (result.data) {
            // Reset all states first
            clearFormData();
            setOtpModalVisible(false);
            setModalRegisterInfoVisible(false);
            setRegistrationData(null); // Clear registration data
            onClosePassModal();
            
            // First call onRegistrationComplete, then onChangeLoginState
            const contact = registrationData[registrationData.registrationType];
            console.log('DEBUG - Completing registration and transitioning to login');
            onRegistrationComplete(registrationData.registrationType, contact);
            
            return true;
          }
        } else {
          // For phone flow - show registration info modal after OTP verification
          console.log('DEBUG - Phone verified, showing registration info modal');
          setOtpModalVisible(false);
          setModalRegisterInfoVisible(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.log('DEBUG - Error in handleVerifyOTP:', error.response?.data || error.message);
      setErrorsUser([error.response?.data?.message || 'Error verifying OTP']);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // CHANGE TO INDIVIDUAL PACKAGES
  const handleResend = () => {
    resendOTP(); // Call the function passed from the parent component
  };

  return {
    models: {
      modalRegisterInfoVisible,
      otpModalVisible,
      password,
      confirmPassword,
      errors,
      errorsUser,
      validationRules,
      inputRef1,
      inputRef2,
      inputRef3,
      inputRef4,
      otp,
      inputRefs,
      isLoading,
      email,
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
      validatePassword,
      validateRegistrationUser,
      handleSendOTP,
      handleVerifyOTP,
      setOtpModalVisible,
    },
  };
};
