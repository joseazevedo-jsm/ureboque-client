import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { useForm } from "../../hooks/useForm";
import { loginValidationSchema, otpValidationSchema } from "../../utils/validationSchemas";
import { useNavigation } from "@react-navigation/native";
import api from "../../services/APIService";
import ErrorService from "../../services/ErrorService";
import axios from "axios";
import { Alert } from "react-native";
import { useLogger } from "../../hooks/useLogger";
 
const apiOTP = axios.create({
  baseURL: "https://api.releans.com/v2/message",
  headers: {
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_RELEANS_API_TOKEN}`,
  },
  maxRedirects: 20,
});

export const useLoginScreen = () => {
  const logger = useLogger('useLoginScreen');
  
  // Form validation for phone number
  const phoneForm = useForm(
    { phoneNumber: "", callingCode: "244" },
    { phoneNumber: loginValidationSchema.phoneNumber }
  );
  
  // Form validation for OTP
  const otpForm = useForm(
    { otpCode: "" },
    otpValidationSchema
  );

  const [codeOTP, setCodeOTP] = useState();
  const [password, setPassword] = useState("");
  const [modalRegisterVisible, setModalRegisterVisible] = useState(false);
  const [modalOtpVisible, setModalOtpVisible] = useState(false);
  const { setUser, login } = useContext(UserContext);
  const auth = useAuth();
  const [warning, setWarning] = useState("");
  const [loginFailed, setLoginFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    if (otpForm.values.otpCode.length === 4) {
      verifyOTPCode();
    }
  }, [otpForm.values.otpCode]);

  const generateRandom4DigitNumber = () => {
    return Math.floor(1000 + Math.random() * 9000);
  };

  const handleCallingCodeSelect = (selectedCallingCode) => {
    phoneForm.setValue("callingCode", selectedCallingCode);
  };

  const handleNumberChange = (text) => {
    phoneForm.setValue("phoneNumber", text);
    setWarning(""); // Clear warning when user types
  };

  const handleOTPChange = (text) => {
    // This function receives the complete 4-digit OTP from the modal
    otpForm.setValue("otpCode", text);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
  };

  const handleOnConfirmNumber = async () => {
    try {
      const random4DigitNumber = generateRandom4DigitNumber();

      const message = {
        mobile: `+${phoneForm.values.callingCode}${phoneForm.values.phoneNumber}`,
        sender: "UREBOQUE",
        content: `O seu codigo para ativação é ${random4DigitNumber}`,
      };

      const response = await apiOTP.post("", message).then();
      const data = response.data;
      logger.info('OTP API response received', data);
      setCodeOTP({ confirm: data, code: random4DigitNumber });

      if (data) {
        logger.info('OTP sent successfully', { messageStatus: response.data.status, otpGenerated: true });
        setModalOtpVisible(true);
      }
    } catch (error) {
      logger.error('Error sending OTP', error);
    }
  };

  const onChangeLoginState = (phone) => {
    setModalOtpVisible(false);
    setModalRegisterVisible(false);
    navigation.navigate("Login", {
      passwordState: 1,
      phone: `${phoneForm.values.callingCode}${phoneForm.values.phoneNumber}`,
    });
  };

  const onLogin = async (phone) => {
    try {
      setIsLoading(true);
      setWarning("");
      setLoginFailed(false);
      
      logger.info('Login attempt', { hasPassword: !!password, phone });
      
      const response = await api.post("/users/login", {
        password: password,
        phone: phone,
      });
      
      const data = response.data;
      logger.info('Login successful', { userId: data.user?.id, hasToken: !!data.token, role: data.user?.role });
      
      // Check user role - drivers cannot log into client app
      if (data.user?.role === 'driver') {
        logger.warn('Driver attempted to login to client app', { userId: data.user.id, role: data.user.role });
        setLoginFailed(true);
        setWarning("Este tipo de conta não pode acessar a aplicação cliente. Use a aplicação do motorista.");
        return;
      }
      
      if (data) {
        try {
          setUser(data.user);
          login(data.token, data.user.id);
          logger.info("Login completed successfully");
        } catch (loginError) {
          logger.error('Error during login process (user data fetch failed)', loginError);
          setLoginFailed(true);
          setWarning("Erro ao carregar dados do usuário. Tente novamente.");
        }
      } else {
        throw new Error("Invalid response data");
      }
    } catch (error) {
      logger.error('Login failed', error);
      setLoginFailed(true);
      
      // Handle different error types
      if (error.response?.status === 401) {
        setWarning("Credenciais incorretas. Verifique sua senha.");
      } else if (error.response?.status === 500) {
        setWarning("Erro no servidor. Tente novamente mais tarde.");
      } else if (error.response?.status === 404) {
        setWarning("Número de telefone não encontrado.");
      } else {
        setWarning("Falha no login. Verifique suas credenciais e tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTPCode = async () => {
    // Check against generated OTP or development default
    const expectedOTP = codeOTP?.code?.toString() || process.env.EXPO_PUBLIC_OTP_DEFAULT;
    
    if (otpForm.values.otpCode === expectedOTP) {
      setModalOtpVisible(false);
      
      const fullPhoneNumber = `${phoneForm.values.callingCode}${phoneForm.values.phoneNumber}`;
      
      try {
        // Check if user exists using GET /phone/:phone endpoint
        const checkUserResponse = await api.get(`/users/phone/${fullPhoneNumber}`);
         if (checkUserResponse.data) {
          // User exists - go to password screen
          logger.info('User found, navigating to login');
          navigation.navigate("Login", {
            passwordState: 1,
            phone: fullPhoneNumber,
          });
        } else {
          // New user - start registration flow
          logger.info('User not found, starting registration flow');
          navigation.navigate("RegistrationWelcome", {
            phone: fullPhoneNumber
          });
        }
      } catch (error) {
        logger.error('Error checking user existence', error);
        // If 404 or user not found, start registration flow
        if (error.response?.status === 404) {
          logger.info('User not found (404), starting registration flow');
          navigation.navigate("RegistrationWelcome", {
            phone: fullPhoneNumber
          });
        } else {
          // For other errors, fallback to registration
          logger.warn('Unexpected error, defaulting to registration flow');
          navigation.navigate("RegistrationWelcome", {
            phone: fullPhoneNumber
          });
        }
      }
    } else {
      Alert.alert("Error", "Invalid OTP code. Please - try again.");
    }
  };

  const clearLoginError = () => {
    setLoginFailed(false);
    setWarning("");
  };

  const goBackToPhoneEntry = () => {
    setLoginFailed(false);
    setWarning("");
    setPassword("");
    phoneForm.setValue("phoneNumber", "");
    setCodeOTP(undefined);
    otpForm.setValue("otpCode", "");
    setModalOtpVisible(false);
    navigation.navigate("Login", {
      passwordState: false,
      phone: "",
    });
  };

  const handleOTPModalClose = () => {
    setModalOtpVisible(false);
    // Clear OTP state when modal is closed
    otpForm.setValue("otpCode", "");
    setCodeOTP(undefined);
  };

  const onVerifyOtp = () => {
    if (phoneForm.values.phoneNumber.length < 9) {
      setWarning("O número de telefone deve ter pelo menos 9 caracteres");
    } else {
      setWarning("");
      const isValid = phoneForm.validate();
      if (isValid) {
        setModalOtpVisible(true);
      }
    }
  };
  return {
    models: {
      callingCode: phoneForm.values.callingCode,
      number: phoneForm.values.phoneNumber,
      password,
      codeOTP,
      otpCode: otpForm.values.otpCode,
      modalRegisterVisible,
      modalOtpVisible,
      warning,
      loginFailed,
      isLoading,
      phoneForm,
      otpForm,
    },
    operations: {
      handleCallingCodeSelect,
      handleNumberChange,
      handlePasswordChange,
      handleOnConfirmNumber,
      onChangeLoginState,
      onLogin,
      handleOTPChange,
      handleOTPModalClose,
      onVerifyOtp,
      clearLoginError,
      goBackToPhoneEntry,
    },
  };
};
