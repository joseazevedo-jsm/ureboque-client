import { useContext, useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native"; // Import the necessary hooks from React Navigation
import { useDispatch, useSelector } from "react-redux";
import { setUser, login } from "../../store/slices/userSlice";

import { Alert } from "react-native";
import { api, otpApi } from "../../services/apiService";
import { handleError, withErrorHandling } from "../../utils/errorHandler";

// Add new API endpoints for OTP
const sendOTP = async (contact, type) => {
  if (type === 'phone') {
    return true;
  }
  try {
    const response = await api.post('/send-otp', {
      [type]: contact // will be either { email: contact } or { phone: contact }
    })
    console.log('-->', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

const verifyOTP = async (contact, type, otp) => {
  if (type === 'phone') {
    return true;
  }
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

export const useLoginScreen = () => {
  const [callingCode, setCallingCode] = useState("244");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [codeOTP, setCodeOTP] = useState();
  const [modalRegisterVisible, setModalRegisterVisible] = useState(false);
  const [modalOtpVisible, setModalOtpVisible] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const dispatch = useDispatch();
  const [warning, setWarning] = useState("");
  const [modalMethodVisible, setModalMethodVisible] = useState(false);
  const [registrationMethod, setRegistrationMethod] = useState('phone');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [loginMethod, setLoginMethod] = useState('phone');
  const [passwordState, setPasswordState] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    if (otpCode.length === 4) {
      console.log('otpCode', otpCode);
      verifyOTPCode();
    }
  }, [otpCode]);

  const generateRandom4DigitNumber = () => {
    return Math.floor(1000 + Math.random() * 9000);
  };

  const handleCallingCodeSelect = (selectedCallingCode) => {
    setCallingCode(selectedCallingCode);
  };

  const handleNumberChange = (text) => {
    setNumber(text);
  };

  const handlePasswordChange = (password) => {
    setPassword(password);
  };

  const handleOTPChange = (text) => {
    setOtpCode((prevCode) => prevCode + text);
    if (text === "") {
      setOtpCode("");
    }
  };

  const onRegisterModalVisible = () => {
    console.log('DEBUG - Starting registration process');
    setIsRegistering(true);
    setModalMethodVisible(true);
  };

  const onCloseMethodModal = () => {
    console.log('DEBUG - Closing method modal');
    setModalMethodVisible(false);
  };

  const onSelectRegistrationMethod = async (method, contact = null, otp = null) => {
    console.log('DEBUG - Selected registration method:', { method, contact });
    console.log('DEBUG - Current state:', { isRegistering, method, contact });
    
    setRegistrationMethod(method);
    setIsRegistering(true); // Set registration mode at the start of flow
    
    try {
      if (method === 'phone') {
        // Store the phone number when provided
        if (contact) {
          const [callingCodePart, numberPart] = contact.split(' ');
          setNumber(numberPart);
          setCallingCode(callingCodePart);
        }
        
        // If OTP is provided, verify it
        if (otp === '1234') {
          setModalRegisterVisible(true);
        }
      } else if (method === 'email') {
        // For email registration, show the password modal first
        console.log('DEBUG - Starting email registration');
        setModalMethodVisible(false);
        setModalRegisterVisible(true);
      }
    } catch (error) {
      console.log('DEBUG - Error in registration method selection:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Error sending OTP');
      setIsRegistering(false); // Reset isRegistering on error
    }
  };

  const onRegistrationComplete = (method, contact) => {
    console.log('DEBUG - Registration complete, transitioning to login:', { method, contact });
    // Call onChangeLoginState to handle the actual state transition
    onChangeLoginState(method, contact);
  };

  const onChangeLoginState = (method, contact) => {
    console.log('DEBUG - onChangeLoginState called with:', { method, contact });
    
    // First, update the login method and contact info
    console.log('DEBUG - Setting login method to:', method);
    setLoginMethod(method);
    
    if (method === 'phone') {
      const [callingCodePart, numberPart] = contact.split(' ');
      console.log('DEBUG - Setting phone info:', { callingCodePart, numberPart });
      setCallingCode(callingCodePart);
      setNumber(numberPart);
    } else {
      console.log('DEBUG - Setting email to:', contact);
      setEmail(contact);
    }
    
    // Then, update all the modal states
    console.log('DEBUG - Closing all modals');
    setModalOtpVisible(false);
    setModalRegisterVisible(false);
    setModalMethodVisible(false);
    
    // Finally, set the password state and ensure we're not in registration mode
    console.log('DEBUG - Finalizing login state changes');
    setIsRegistering(false); // Ensure registration mode is off
    setPasswordState(true); // Set password state immediately
    setWarning(""); // Clear any warnings
    
    console.log('DEBUG - Final state:', {
      loginMethod: method,
      contact,
      isRegistering: false,
      passwordState: true,
      modalStates: {
        otp: false,
        register: false,
        method: false
      }
    });
  };

  const handleOnConfirmNumber = async () => {
    try {
      if (loginMethod === 'phone') {
        const phoneNumber = `${callingCode} ${number}`;
        await sendOTP(phoneNumber, 'phone');
      } else if (loginMethod === 'email') {
        await sendOTP(email, 'email');
      }
      setModalOtpVisible(true);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error sending OTP');
    }
  };

  const verifyOTPCode = async () => {
    try {
      // Handle mock OTP for phone registration
      if (isRegistering && registrationMethod === 'phone') {
        console.log('DEBUG - Verifying mock OTP for phone registration');
        if (otpCode === '1234') {
          console.log('DEBUG - Mock OTP verified successfully');
          setModalOtpVisible(false);
          setModalRegisterVisible(true);
          setOtpCode('');
          return;
        } else {
          console.log('DEBUG - Invalid mock OTP');
          Alert.alert('Error', 'Invalid OTP code. Please try again.');
          setOtpCode('');
          return;
        }
      }

      // Regular OTP verification for other cases
      const method = isRegistering ? registrationMethod : loginMethod;
      console.log('DEBUG - Verification State:', {
        isRegistering,
        method,
        registrationMethod,
        loginMethod
      });
      
      const contact = method === 'email' ? email : `${callingCode} ${number}`;
      console.log('DEBUG - Attempting verification with:', { contact, method, otpCode });
      
      const verified = await verifyOTP(contact, method, otpCode);
      console.log('DEBUG - Verification result:', verified);
      
      if (verified) {
        console.log('DEBUG - Verification successful, current state:', {
          isRegistering,
          modalOtpVisible: true,
          modalRegisterVisible: false
        });
        
        // Close OTP modal and clear code
        setModalOtpVisible(false);
        setOtpCode("");
        
        if (isRegistering) {
          console.log('DEBUG - Showing register modal for password creation');
          // For registration: show password creation modal
          setModalRegisterVisible(true);
          // Prevent further OTP sending
          setIsRegistering(false);
        } else {
          console.log('DEBUG - Moving to password entry');
          // For login: use onChangeLoginState for consistent state management
          onChangeLoginState(method, contact);
        }
      }
    } catch (error) {
      console.log('DEBUG - Verification error:', error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Invalid OTP code. Please try again.");
      setOtpCode("");
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
  };

  const onVerifyOtp = async () => {
    if (loginMethod === 'phone') {
      if (number.length < 9) {
        setWarning("O número de telefone deve ter pelo menos 9 caracteres");
        return;
      }
    } else {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setWarning("Por favor, insira um email válido");
        return;
      }
    }
    setWarning("");
    await handleOnConfirmNumber();
  };

  const onLogin = async (contact) => {
    try {
      console.log('DEBUG - Attempting login with:', { contact, loginMethod, password });
      const response = await api.post("/login", {
        password: password,
        [loginMethod]: contact // will be either { email: contact } or { phone: contact }
      });
      
      const data = response.data;
      console.log("-->", data);
      if (data) {
        dispatch(setUser(data.user));
        dispatch(login({ token: data.token, id: data.user.id }));
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      setWarning(error.response?.data?.message || "Erro ao fazer login");
    }
  };

  // This is called from the main login screen's "AVANÇAR" button
  const onAdvanceLogin = async () => {
    setIsRegistering(false); // Ensure we're in login mode
    setWarning("");
    await onVerifyOtp();
    setPasswordState(true);

  };

  const onCloseOTPModal = () => {
    setModalOtpVisible(false);
    setOtpCode("");
  };

  const onCloseRegisterPassModal = () => {
    setModalRegisterVisible(false);
  };

  return {
    models: {
      callingCode,
      number,
      codeOTP,
      password,
      modalRegisterVisible,
      modalOtpVisible,
      warning,
      modalMethodVisible,
      registrationMethod,
      isRegistering,
      email,
      loginMethod,
      passwordState,
    },
    operations: {
      handleCallingCodeSelect,
      handleNumberChange,
      handleEmailChange,
      handleOnConfirmNumber,
      onChangeLoginState,
      onLogin,
      handlePasswordChange,
      handleOTPChange,
      onVerifyOtp,
      onRegisterModalVisible,
      onCloseMethodModal,
      onSelectRegistrationMethod,
      onRegistrationComplete,
      onAdvanceLogin,
      onCloseOTPModal,
      setLoginMethod,
      onCloseRegisterPassModal,
      setPasswordState,
    },
  };
};
