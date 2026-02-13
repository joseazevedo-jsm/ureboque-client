import { useState, useEffect } from "react";
import { useUserData } from "../../context/UserDataContext";
import * as ImagePicker from "expo-image-picker";
import axios from "axios"; // Keep for external image service
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

  // OTP-related state
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState("");
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState(user?.phone || "");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [onSaveComplete, setOnSaveComplete] = useState(null);

  // Update original phone number when user data changes
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
    // Store only the phone number part (without country code) for display
    setPhoneNumberInput(text);
    // Store the full phone number (244 + phone number) for API calls
    const fullPhoneNumber = formatFullPhoneNumber("244", text);
    setPhoneNumber(fullPhoneNumber);
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

    // Show success message and navigate back
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

  const handleSaveChanges = async (navigation) => {
    setIsSaving(true);

    try {
      // Check if phone number has changed
      const hasPhoneChanged = phoneNumber !== originalPhoneNumber;
      logger.debug('Save attempt', {
        phoneNumber,
        originalPhoneNumber,
        hasPhoneChanged
      });

      if (hasPhoneChanged) {
        // Store pending phone number and callback for after OTP verification
        setPendingPhoneNumber(phoneNumber);
        setOnSaveComplete(() => () => {
          if (navigation && navigation.goBack) {
            navigation.goBack();
          }
        });
        setShowOTPModal(true);
        setIsSaving(false);
        return; // Exit here, actual save will happen after OTP verification
      }

      // Continue with normal save process if phone number hasn't changed
      await performSave(phoneNumber, navigation);

    } catch (error) {
      logger.error('Error updating user profile', error);

      // Show error message
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
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
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
    const apiKey = "6d207e02198a847aa98d0a2a901485a5";

    // Define the request data.
    const formData = new FormData();
    formData.append("key", apiKey);
    formData.append("action", "upload");
    formData.append("format", "json");
    formData.append("source", {
      uri: file,
      name: "image.jpg",
      type: "image/jpeg",
    });

    // Make the POST request using Axios
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
      throw error; // Re-throw the error to handle it in the caller if needed.
    }
  };

  const requestOTPForPhoneChange = async (phoneNumber) => {
    logger.debug('Mock OTP request for phone number change', { phoneNumber });

    // Mock OTP request - just show the modal without API call
    logger.info('Using mock OTP (1234) for phone change');
    setShowOTPModal(true);
  };

  const handleOTPVerification = async (otp) => {
    if (!otp || otp.length !== 4) {
      showAlert?.({ type: 'error', title: 'Erro', message: 'Por favor, digite o código de 4 dígitos', buttons: [{ text: 'OK' }] });
      return;
    }

    setIsVerifyingOTP(true);
    logger.debug('Mock OTP verification for phone number change', { otp: otp.length });

    // Mock verification - only check against 1234
    const defaultOTP = process.env.EXPO_PUBLIC_OTP_DEFAULT || "1234";

    // Simulate loading time
    setTimeout(async () => {
      if (otp === defaultOTP) {
        logger.info('Mock OTP verification successful for phone change');

        try {
          // Complete the save with verified phone number  
          await performSave(pendingPhoneNumber, null);

          // Update original phone number to new verified number
          setOriginalPhoneNumber(pendingPhoneNumber);
          setShowOTPModal(false);
          setIsVerifyingOTP(false);

          // Call the navigation callback if it exists
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
      } else {
        logger.warn('Mock OTP verification failed - incorrect code');
        setIsVerifyingOTP(false);

        showAlert?.({
          type: 'error',
          title: 'Erro',
          message: 'Código de verificação inválido. Use 1234 para testar.',
          buttons: [{ text: 'OK' }]
        });
      }
    }, 1000); // 1 second delay to simulate API call
  };

  const handleOTPModalClose = () => {
    logger.debug('OTP modal closed, reverting phone number changes');

    // Revert phone number changes if OTP was not verified
    setPhoneNumber(originalPhoneNumber);
    setPhoneNumberInput(extractPhoneNumber(originalPhoneNumber));
    setShowOTPModal(false);
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
