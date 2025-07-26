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

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API; //attt ao apagar

const apiOTP = axios.create({
  baseURL: "https://api.releans.com/v2/message",
  headers: {
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjkyNjgyMGQwLTAwZDctNGQ2MS04MDAyLTc3YWJkYTEwZjMyZiIsImlhdCI6MTY5MjIyODM3NCwiaXNzIjoxNzA4OH0.UO5976E-4CBqc4hFNIjxrwgbzkmQO8lcNALUmbSW8s0", // Replace with your actual authorization header
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

  const handleOnConfirmNumber = async () => {
    try {
      const random4DigitNumber = generateRandom4DigitNumber();

      const message = {
        mobile: "+34663120477", // Replace with the recipient's phone number
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
      phone: "244", // `${callingCode} ${number}` phone
    });
  };

  const onLogin = async (phone) => {
    console.log(password, phone);
    await api
      .post("/login", {
        password: password,
        phone: phone,
      })
      .then((response) => {
        const data = response.data;
        console.log("-->", data);
        if (data) {
          setUser(data.user);
          // navigation.navigate("SideMenu");
          login(data.token, data.user.id);
        }
      });
  };

  const verifyOTPCode = () => {
    if (otpCode === "1234") {
      // if user not exist modalRegVisible
      setModalOtpVisible(false);
      navigation.navigate("Login", {
        passwordState: 1,
        phone: number, // `${callingCode} ${number}`
      });
      // You can navigate to the next screen or perform further actions here
    } else {
      Alert.alert("Error", "Invalid OTP code. Please try again.");
    }
  };

  const onVerifyOtp = () => {
    if (number.length < 9) {
      setWarning("O número de telefone deve ter pelo menos 9 caracteres");
    } else {
      setWarning("");
      // Perform your verification logic here
      // setModalOtpVisible(true);

      // handleOnConfirmNumber();

      setModalOtpVisible(true);
    }
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
    },
    operations: {
      handleCallingCodeSelect,
      handleNumberChange,
      handleOnConfirmNumber,
      onChangeLoginState,
      onLogin,
      handlePasswordChange,
      handleOTPChange,
      onVerifyOtp,
    },
  };
};
