import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { useForm } from "../../hooks/useForm";
import { loginValidationSchema, otpValidationSchema } from "../../utils/validationSchemas";
import { validateForm } from "../../utils/validation";
import { useNavigation } from "@react-navigation/native";
import api from "../../services/APIService";
import { useLogger } from "../../hooks/useLogger";
import { useAlert } from "../../context/AlertContext";

const MIN_PHONE_DIGITS = 9;
const MAX_PHONE_DIGITS = 15; // ITU E.164 upper bound

export const useLoginScreen = () => {
  const logger = useLogger('useLoginScreen');
  const { showAlert } = useAlert();
  // Synchronous guard: `isLoading` state updates too late to stop a second tap
  // dispatched in the same frame, so rapid taps produced duplicate requests.
  const submitInFlight = useRef(false);

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
  const [otpError, setOtpError] = useState(false);
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
    // Accept digits only and cap the length: pasted input bypasses the numeric
    // keyboard, and an unnormalized number reaches the API as a different
    // identity than the same user's canonical one (e.g. "912 345 666").
    const digitsOnly = String(text ?? "").replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS);
    phoneForm.setValue("phoneNumber", digitsOnly);
    setWarning("");
  };

  const handleOTPChange = (text) => {
    if (text) setOtpError(false);
    otpForm.setValue("otpCode", text);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
  };

  const handleOnConfirmNumber = async () => {
    const fullPhoneNumber = getFullPhoneNumber();
    const devOTPAllowed = __DEV__ || process.env.EXPO_PUBLIC_ALLOW_DEV_OTP === 'true';
    const devOTP = devOTPAllowed ? process.env.EXPO_PUBLIC_OTP_DEFAULT : undefined;

    if (__DEV__ && devOTP) {
      setCodeOTP({ phone: fullPhoneNumber, development: true });
      setModalOtpVisible(true);
      return;
    }

    try {
      const response = await api.post("/users/send-otp", {
        phone: fullPhoneNumber,
      });

      logger.info('OTP sent successfully', { method: response.data?.method });
      setCodeOTP({ phone: fullPhoneNumber, method: response.data?.method });
      setModalOtpVisible(true);
    } catch (error) {
      if (devOTP) {
        logger.warn('OTP backend unavailable; using development OTP fallback', { errorMessage: error.message });
        setCodeOTP({ phone: fullPhoneNumber, development: true });
        setModalOtpVisible(true);
        return;
      }

      try {
        const checkUserResponse = await api.get(`/users/phone/${fullPhoneNumber}`);
        if (checkUserResponse.data) {
          logger.warn('OTP backend unavailable; existing user continuing with password login', { errorMessage: error.message });
          navigation.navigate("Login", {
            passwordState: 1,
            phone: fullPhoneNumber,
          });
          return;
        }
      } catch (checkUserError) {
        logger.warn('Unable to confirm existing user after OTP failure', { errorMessage: checkUserError.message });
      }

      logger.error('Error sending OTP', error);
      showAlert({
        type: 'error',
        title: 'Erro ao enviar código',
        message: 'Não foi possível enviar o código SMS. Verifique o número e tente novamente.',
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
    if (submitInFlight.current) {
      logger.debug('Login already in flight, ignoring duplicate submit');
      return;
    }

    if (!password) {
      setLoginFailed(true);
      setWarning("Introduza a sua senha.");
      return;
    }

    try {
      submitInFlight.current = true;
      setIsLoading(true);
      setWarning("");
      setLoginFailed(false);

      logger.info('Login attempt', { hasPassword: !!password, hasPhone: !!phone });

      const response = await api.post("/users/login", {
        password: password,
        phone: phone,
        app: "client",
      });

      const data = response.data;
      logger.info('Login successful', { userId: data.user?.id, hasToken: !!data.token, role: data.user?.role });

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

      if (!error.response) {
        // No response at all: the request never reached the server. Blaming the
        // user's credentials for a dead network sends them chasing the wrong fix.
        setWarning(
          error.code === 'ECONNABORTED'
            ? "O servidor demorou a responder. Tente novamente."
            : "Sem ligação à internet. Verifique a sua ligação e tente novamente."
        );
      } else if (error.response.status === 403) {
        setWarning("Este tipo de conta não pode acessar a aplicação cliente. Use a aplicação do motorista.");
      } else if (error.response.status === 401) {
        setWarning("Credenciais incorretas. Verifique sua senha.");
      } else if (error.response.status === 500) {
        setWarning("Erro no servidor. Tente novamente mais tarde.");
      } else if (error.response.status === 404) {
        setWarning("Número de telefone não encontrado.");
      } else {
        setWarning("Falha no login. Verifique suas credenciais e tente novamente.");
      }
    } finally {
      submitInFlight.current = false;
      setIsLoading(false);
    }
  };

  const verifyOTPCode = async () => {
    const fullPhoneNumber = getFullPhoneNumber();
    const enteredOTP = otpForm.values.otpCode;
    const devOTPAllowed = __DEV__ || process.env.EXPO_PUBLIC_ALLOW_DEV_OTP === 'true';
    const devOTP = devOTPAllowed ? process.env.EXPO_PUBLIC_OTP_DEFAULT : undefined;

    // Clearing the entered code is what makes a retry possible: the verify
    // effect keys off the code string, so re-entering the *same* wrong code
    // would otherwise leave the value unchanged and never fire again.
    const rejectOtp = () => {
      setOtpError(true);
      otpForm.setValue("otpCode", "");
      showAlert({ type: 'error', title: 'Erro', message: 'Código OTP inválido. Tente novamente.' });
    };

    if (codeOTP?.development) {
      if (!devOTP || enteredOTP !== devOTP) {
        rejectOtp();
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
        rejectOtp();
        return;
      }
    }

    setOtpError(false);
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
          title: 'Erro de ligação',
          message: isNetworkError
            ? 'Não foi possível ligar ao servidor. Verifique a sua internet e tente novamente.'
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
    if (phoneForm.values.phoneNumber.length < MIN_PHONE_DIGITS) {
      setWarning(`O número de telefone deve ter pelo menos ${MIN_PHONE_DIGITS} caracteres`);
      return;
    }

    setWarning("");

    // `validate()` writes phoneForm.errors via setState, so it is still stale on
    // this tick — and the screen never renders those errors anyway. Compute the
    // message synchronously so an invalid number explains itself instead of
    // leaving the button looking broken.
    const phoneValidation = validateForm(
      { phoneNumber: phoneForm.values.phoneNumber },
      { phoneNumber: loginValidationSchema.phoneNumber }
    );
    phoneForm.validate();

    if (!phoneValidation.isValid) {
      setWarning(
        phoneValidation.errors.phoneNumber ||
          "Número de telefone inválido. Verifique e tente novamente."
      );
      return;
    }

    if (submitInFlight.current) {
      logger.debug('Phone confirmation already in flight, ignoring duplicate submit');
      return;
    }

    try {
      submitInFlight.current = true;
      await handleOnConfirmNumber();
    } finally {
      submitInFlight.current = false;
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
      otpError,
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
