import { useRef, useState } from "react";

export const useOTPModal = (OTPChange) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Handle auto-focus when typing forward
    if (text && index < 3) {
      inputRefs.current[index + 1].focus();
    }
    // Verify OTP if all 4 digits are entered
    else if (text && index === 3) {
      const completeOTP = [...newOtp.slice(0, 3), text].join("");
      OTPChange(completeOTP);
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index]) {
      if (index > 0) {
        inputRefs.current[index - 1].focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  return {
    models: {
      otp,
      inputRefs,
    },
    operations: {
      handleOtpChange,
      handleKeyPress,
    },
  };
};
