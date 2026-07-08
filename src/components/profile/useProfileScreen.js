import { useState, useEffect } from "react";
import { useUserData } from "../../context/UserDataContext";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import api from "../../services/APIService";
import { useLogger } from "../../hooks/useLogger";
import { extractPhoneNumber, formatFullPhoneNumber } from "../../utils/phoneUtils";

const useProfileScreen = (showAlert) => {
  const logger = useLogger('useProfileScreen');
  const { user, updateUser } = useUserData();
  const [name, setName] = useState();
  const [surname, setSurname] = useState();
  const [photo, setPhoto] = useState(user?.photo);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [phoneNumberInput, setPhoneNumberInput] = useState(extractPhoneNumber(user?.phone) || "");
  const [email, setEmail] = useState(user?.email || "");
  const [image, setImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState("");
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState(user?.phone || "");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [onSaveComplete, setOnSaveComplete] = useState(null);
  const [phoneChangeOTP, setPhoneChangeOTP] = useState(null);

  useEffect(() => {
    if (user?.phone && !showOTPModal) {
      setOriginalPhoneNumber(user.phone);
    }
  }, [user?.phone, showOTPModal]);

  const handleNameChange = (text) => {
    setName(text);
  };

  const handleSurnameChange = (text) => {
    setSurname(text);
  };

  const handlePhoneNumberChange = (text) => {
    setPhoneNumberInput(text);
    setPhoneNumber(formatFullPhoneNumber("244", text));
  };

  const handleEmailChange = (text) => {
    setEmail(text);
  };

  const performSave = async (phoneToSave, navigation) => {
    let new_photo_url = photo;

    if (image) {
      new_photo_url = await sendImageToServer(image);
    }

    const userData = {
      details: {
        name: name ? name : user?.name.split(" ", 2)[0],
        surname: surname ? surname : user?.name.split(" ", 2)[1],
      },
      phone: phoneToSave,
      user_photo_url: new_photo_url,
      email,
    };

    await updateUser(user.id, userData);

    showAlert?.({
      type: 'success',
      title: 'Sucesso',
      message: 'Perfil atualizado com sucesso!',
      buttons: [{
        text: 'OK',
        onPress: () => {
          if (navigation && navigation.goBack) {
            navigation.goBack();
          }
        }
      }]
    });
  };

  const requestOTPForPhoneChange = async (newPhoneNumber) => {
    try {
      const response = await api.post("/users/send-otp", {
        phone: newPhoneNumber,
        email,
      });

      logger.info('Phone change OTP requested', { method: response.data?.method });
      setPhoneChangeOTP({ phone: newPhoneNumber, method: response.data?.method });
      setShowOTPModal(true);
    } catch (error) {
      const devOTP = __DEV__ ? process.env.EXPO_PUBLIC_OTP_DEFAULT : undefined;
      if (devOTP) {
        logger.warn('OTP backend unavailable; using development OTP fallback for phone change', {
          errorMessage: error.message,
        });
        setPhoneChangeOTP({ phone: newPhoneNumber, development: true });
        setShowOTPModal(true);
        return;
      }

      throw error;
    }
  };

  const handleSaveChanges = async (navigation) => {
    setIsSaving(true);

    try {
      const hasPhoneChanged = phoneNumber !== originalPhoneNumber;
      logger.debug('Save attempt', {
        phoneNumber,
        originalPhoneNumber,
        hasPhoneChanged
      });

      if (hasPhoneChanged) {
        setPendingPhoneNumber(phoneNumber);
        setOnSaveComplete(() => () => {
          if (navigation && navigation.goBack) {
            navigation.goBack();
          }
        });
        await requestOTPForPhoneChange(phoneNumber);
        setIsSaving(false);
        return;
      }

      await performSave(phoneNumber, navigation);
    } catch (error) {
      logger.error('Error updating user profile', error);
      showAlert?.({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao atualizar perfil. Por favor verifique os dados.',
        buttons: [{ text: 'OK' }]
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    logger.info('Image picker result', { hasAssets: !!result.assets?.[0], canceled: result.canceled });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const sendImageToServer = async (file) => {
    const apiUrl = "https://freeimage.host/api/1/upload";
    const apiKey = process.env.EXPO_PUBLIC_FREEIMAGE_API_KEY;

    if (!apiKey) {
      throw new Error("Missing EXPO_PUBLIC_FREEIMAGE_API_KEY");
    }

    const formData = new FormData();
    formData.append("key", apiKey);
    formData.append("action", "upload");
    formData.append("format", "json");
    formData.append("source", {
      uri: file,
      name: "image.jpg",
      type: "image/jpeg",
    });

    try {
      const response = await axios.post(apiUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      logger.info('Image upload successful', { hasDisplayUrl: !!response.data.image?.display_url });
      return response.data.image.display_url;
    } catch (error) {
      logger.error('Image upload failed', error);
      throw error;
    }
  };

  const verifyPhoneChangeOTP = async (otp) => {
    const devOTP = __DEV__ ? process.env.EXPO_PUBLIC_OTP_DEFAULT : undefined;

    if (phoneChangeOTP?.development) {
      if (!devOTP || otp !== devOTP) {
        throw new Error("Invalid development OTP");
      }
      return;
    }

    await api.post("/users/verify-otp", {
      phone: pendingPhoneNumber,
      otp,
    });
  };

  const handleOTPVerification = async (otp) => {
    if (!otp || otp.length !== 4) {
      showAlert?.({ type: 'error', title: 'Erro', message: 'Por favor, digite o codigo de 4 digitos', buttons: [{ text: 'OK' }] });
      return;
    }

    setIsVerifyingOTP(true);
    logger.debug('OTP verification for phone number change', { otpLength: otp.length });

    try {
      await verifyPhoneChangeOTP(otp);
    } catch (error) {
      logger.warn('OTP verification failed for phone change', error);
      setIsVerifyingOTP(false);
      showAlert?.({
        type: 'error',
        title: 'Erro',
        message: 'Codigo de verificacao invalido. Tente novamente.',
        buttons: [{ text: 'OK' }]
      });
      return;
    }

    try {
      logger.info('OTP verification successful for phone change');
      await performSave(pendingPhoneNumber, null);
      setOriginalPhoneNumber(pendingPhoneNumber);
      setShowOTPModal(false);
      setPhoneChangeOTP(null);
      setIsVerifyingOTP(false);

      if (onSaveComplete) {
        onSaveComplete();
        setOnSaveComplete(null);
      }
    } catch (error) {
      logger.error('Error updating user profile after OTP verification', error);
      setIsVerifyingOTP(false);
      setShowOTPModal(false);

      showAlert?.({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao atualizar perfil. Tente novamente.',
        buttons: [{ text: 'OK' }]
      });
    }
  };

  const handleOTPModalClose = () => {
    logger.debug('OTP modal closed, reverting phone number changes');
    setPhoneNumber(originalPhoneNumber);
    setPhoneNumberInput(extractPhoneNumber(originalPhoneNumber));
    setShowOTPModal(false);
    setPhoneChangeOTP(null);
    setPendingPhoneNumber("");
    setOnSaveComplete(null);
    setIsSaving(false);
  };

  const hasChanges =
    (name !== undefined && name !== (user?.name?.split(" ", 2)[0] || "")) ||
    (surname !== undefined && surname !== (user?.name?.split(" ", 2)[1] || "")) ||
    (phoneNumber !== (user?.phone || "")) ||
    (email !== (user?.email || "")) ||
    (image !== null);

  return {
    models: {
      user,
      name,
      surname,
      phoneNumber,
      phoneNumberInput,
      email,
      image,
      isSaving,
      showOTPModal,
      pendingPhoneNumber,
      isVerifyingOTP,
      hasChanges,
    },
    operations: {
      handleNameChange,
      handleSurnameChange,
      handlePhoneNumberChange,
      handleEmailChange,
      handleSaveChanges,
      handleOpenImagePicker,
      handleOTPVerification,
      handleOTPModalClose,
    },
  };
};

export default useProfileScreen;
