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

const apiOTP = axios.create({
  baseURL: "https://api.releans.com/v2/message",
  headers: {
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_RELEANS_API_TOKEN}`,
  },
  maxRedirects: 20,
});

export const useLoginScreen = () => {
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
    if (text === "") {
      otpForm.setValue("otpCode", "");
    } else {
      otpForm.setValue("otpCode", otpForm.values.otpCode + text);
    }
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
      console.log(data);
      setCodeOTP({ confirm: data, code: random4DigitNumber });

      if (data) {
        console.log({ message: response.data, otp: random4DigitNumber });
        setModalOtpVisible(true);
      }
    } catch (error) {
      console.error("Error fetching user by ID:", error);
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
    console.log(password, phone);
    try {
      const response = await api.post("/users/login", {
        password: password,
        phone: phone,
      });
      const data = response.data;
      console.log("-->", data);
      if (data) {
        setUser(data.user);
        login(data.token, data.user.id);
      }
    } catch (error) {
      ErrorService.handleAPIError(error);
    }
  };

  const verifyOTPCode = () => {
    // Check against generated OTP or development default
    const expectedOTP = codeOTP?.code?.toString() || process.env.EXPO_PUBLIC_OTP_DEFAULT;
    
    if (otpForm.values.otpCode === expectedOTP) {
      // if user not exist modalRegVisible
      setModalOtpVisible(false);
      navigation.navigate("Login", {
        passwordState: 1,
        phone: phoneForm.values.phoneNumber, // `${callingCode} ${number}`
      });
      // You can navigate to the next screen or perform further actions here
    } else {
      Alert.alert("Error", "Invalid OTP code. Please try again.");
    }
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
      onVerifyOtp,
    },
  };
};
