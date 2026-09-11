import { useRef, useState } from "react";

export const useOTPModal = (OTPChange, onResend) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Report every edit, not only a digit landing in the last box. Reporting
    // only on index 3 meant correcting an earlier box never reached the parent,
    // so a fully-typed code sat there and was never verified.
    OTPChange(newOtp.join(""));

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index]) {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        OTPChange(newOtp.join(""));
      }
    }
  };

  const resetOtp = () => {
    setOtp(["", "", "", ""]);
    OTPChange("");
    inputRefs.current[0]?.focus();
  };

  const handleResend = () => {
    resetOtp();
    onResend?.();
  };

  return {
    models: {
      otp,
      inputRefs,
    },
    operations: {
      handleOtpChange,
      handleKeyPress,
      resetOtp,
      handleResend,
    },
  };
};
