import { useState } from "react";
import { Alert } from "react-native";
import { useUserData } from "../../context/UserDataContext";
import * as ImagePicker from "expo-image-picker";
import axios from "axios"; // Keep for external image service
import api from "../../services/APIService";
import { useLogger } from "../../hooks/useLogger";
import { extractPhoneNumber, formatFullPhoneNumber } from "../../utils/phoneUtils";

const useProfileScreen = () => {
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
    setPhoneNumber(formatFullPhoneNumber("244", text));
  };

  const handleEmailChange = (text) => {
    setEmail(text);
  };

  const handleSaveChanges = async (navigation) => {
    setIsSaving(true);
    
    try {
      let new_photo_url = photo; // Initialize with the current photo URL.

      if (image) {
        new_photo_url = await sendImageToServer(image); // Use 'await' since 'sendImageToServer' is async
      }

      const userData = {
        details: {
          name: name ? name : user?.name.split(" ", 2)[0],
          surname: surname ? surname : user?.name.split(" ", 2)[1],
        },
        phone: phoneNumber,
        user_photo_url: new_photo_url,
        email,
      };

      await updateUser(user.id, userData);
      
      // Show success message and navigate back
      Alert.alert(
        "Sucesso",
        "Perfil atualizado com sucesso!",
        [
          {
            text: "OK",
            onPress: () => {
              if (navigation) {
                navigation.goBack();
              }
            }
          }
        ]
      );
      
    } catch (error) {
      logger.error('Error updating user profile', error);
      
      // Show error message
      Alert.alert(
        "Erro",
        "Erro ao atualizar perfil. Tente novamente.",
        [{ text: "OK" }]
      );
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
    },
    operations: {
      handleNameChange,
      handleSurnameChange,
      handlePhoneNumberChange,
      handleEmailChange,
      handleSaveChanges,
      handleOpenImagePicker,
    },
  };
};

export default useProfileScreen;
