import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext";
import { useNavigation } from "@react-navigation/native"; // Import the necessary hooks from React Navigation

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

const api = axios.create({
  baseURL: `${IP}/users`,
});

export const useLoginScreen = () => {
  const [callingCode, setCallingCode] = useState("244");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [codeOTP, setCodeOTP] = useState();
  const [modalRegisterVisible, setModalRegisterVisible] = useState(false);
  const [modalOtpVisible, setModalOtpVisible] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const { setUser, login } = useContext(UserContext);
  const [warning, setWarning] = useState("");

  const navigation = useNavigation();

  useEffect(() => {
    if (otpCode.length === 4) {
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
