import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { useForm } from "../../hooks/useForm";
import { loginValidationSchema, otpValidationSchema } from "../../utils/validationSchemas";
import { useNavigation } from "@react-navigation/native";
import api from "../../services/APIService";
import { useLogger } from "../../hooks/useLogger";
import { useAlert } from "../../context/AlertContext";

export const useLoginScreen = () => {
  const logger = useLogger('useLoginScreen');
  const { showAlert } = useAlert();

  const phoneForm = useForm(
    { phoneNumber: "", callingCode: "244" },
    { phoneNumber: loginValidationSchema.phoneNumber }
  );

  const otpForm = useForm(
    { otpCode: "" },
    otpValidationSchema
  );

  const [codeOTP, setCodeOTP] = useState();
  const [password, setPassword] = useState("");
  const [modalRegisterVisible, setModalRegisterVisible] = useState(false);
  const [modalOtpVisible, setModalOtpVisible] = useState(false);
  const { setUser, login } = useContext(UserContext);
  const [warning, setWarning] = useState("");
  const [loginFailed, setLoginFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();

  const getFullPhoneNumber = () =>
    `${phoneForm.values.callingCode}${phoneForm.values.phoneNumber}`;

  useEffect(() => {
    if (otpForm.values.otpCode.length === 4) {
      verifyOTPCode();
    }
  }, [otpForm.values.otpCode]);

  const handleCallingCodeSelect = (selectedCallingCode) => {
    phoneForm.setValue("callingCode", selectedCallingCode);
  };

  const handleNumberChange = (text) => {
    phoneForm.setValue("phoneNumber", text);
    setWarning("");
  };

  const handleOTPChange = (text) => {
    otpForm.setValue("otpCode", text);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
  };

  const handleOnConfirmNumber = async () => {
    const fullPhoneNumber = getFullPhoneNumber();

    try {
      const response = await api.post("/users/send-otp", {
        phone: fullPhoneNumber,
      });

      logger.info('OTP sent successfully', { method: response.data?.method });
      setCodeOTP({ phone: fullPhoneNumber, method: response.data?.method });
      setModalOtpVisible(true);
    } catch (error) {
      const devOTP = __DEV__ ? process.env.EXPO_PUBLIC_OTP_DEFAULT : undefined;
      if (devOTP) {
        logger.warn('OTP backend unavailable; using development OTP fallback', { errorMessage: error.message });
        setCodeOTP({ phone: fullPhoneNumber, development: true });
        setModalOtpVisible(true);
        return;
      }

      logger.error('Error sending OTP', error);
      showAlert({
        type: 'error',
        title: 'Erro ao enviar codigo',
        message: 'Nao foi possivel enviar o codigo SMS. Verifique o numero e tente novamente.',
        buttons: [{ text: 'OK' }],
      });
    }
  };

  const onChangeLoginState = () => {
    setModalOtpVisible(false);
    setModalRegisterVisible(false);
    navigation.navigate("Login", {
      passwordState: 1,
      phone: getFullPhoneNumber(),
    });
  };

  const onLogin = async (phone) => {
    try {
      setIsLoading(true);
      setWarning("");
      setLoginFailed(false);

      logger.info('Login attempt', { hasPassword: !!password, hasPhone: !!phone });

      const response = await api.post("/users/login", {
        password: password,
        phone: phone,
      });

      const data = response.data;
      logger.info('Login successful', { userId: data.user?.id, hasToken: !!data.token, role: data.user?.role });

      if (data.user?.role === 'driver') {
        logger.warn('Driver attempted to login to client app', { userId: data.user.id, role: data.user.role });
        setLoginFailed(true);
        setWarning("Este tipo de conta nao pode acessar a aplicacao cliente. Use a aplicacao do motorista.");
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
          setWarning("Erro ao carregar dados do usuario. Tente novamente.");
        }
      } else {
        throw new Error("Invalid response data");
      }
    } catch (error) {
      logger.error('Login failed', error);
      setLoginFailed(true);

      if (error.response?.status === 401) {
        setWarning("Credenciais incorretas. Verifique sua senha.");
      } else if (error.response?.status === 500) {
        setWarning("Erro no servidor. Tente novamente mais tarde.");
      } else if (error.response?.status === 404) {
        setWarning("Numero de telefone nao encontrado.");
      } else {
        setWarning("Falha no login. Verifique suas credenciais e tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTPCode = async () => {
    const fullPhoneNumber = getFullPhoneNumber();
    const enteredOTP = otpForm.values.otpCode;
    const devOTP = __DEV__ ? process.env.EXPO_PUBLIC_OTP_DEFAULT : undefined;

    if (codeOTP?.development) {
      if (!devOTP || enteredOTP !== devOTP) {
        showAlert({ type: 'error', title: 'Erro', message: 'Codigo OTP invalido. Tente novamente.' });
        return;
      }
    } else {
      try {
        await api.post("/users/verify-otp", {
          phone: fullPhoneNumber,
          otp: enteredOTP,
        });
      } catch (error) {
        logger.error('OTP verification failed', error);
        showAlert({ type: 'error', title: 'Erro', message: 'Codigo OTP invalido. Tente novamente.' });
        return;
      }
    }

    setModalOtpVisible(false);

    try {
      const checkUserResponse = await api.get(`/users/phone/${fullPhoneNumber}`);
      if (checkUserResponse.data) {
        logger.info('User found, navigating to login');
        navigation.navigate("Login", {
          passwordState: 1,
          phone: fullPhoneNumber,
        });
      } else {
        logger.info('User not found, starting registration flow');
        navigation.navigate("RegistrationWelcome", {
          phone: fullPhoneNumber
        });
      }
    } catch (error) {
      logger.error('Error checking user existence', error);
      if (error.response?.status === 404) {
        logger.info('User not found (404), starting registration flow');
        navigation.navigate("RegistrationWelcome", {
          phone: fullPhoneNumber
        });
      } else {
        logger.warn('Network or server error during user check', error);
        const isNetworkError = !error.response;
        showAlert({
          type: 'error',
          title: 'Erro de ligacao',
          message: isNetworkError
            ? 'Nao foi possivel ligar ao servidor. Verifique a sua internet e tente novamente.'
            : 'Ocorreu um erro inesperado. Tente novamente.',
          buttons: [{ text: 'OK' }],
        });
      }
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
    otpForm.setValue("otpCode", "");
    setCodeOTP(undefined);
  };

  const onVerifyOtp = async () => {
    if (phoneForm.values.phoneNumber.length < 9) {
      setWarning("O numero de telefone deve ter pelo menos 9 caracteres");
    } else {
      setWarning("");
      const isValid = phoneForm.validate();
      if (isValid) {
        await handleOnConfirmNumber();
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
