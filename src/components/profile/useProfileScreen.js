import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from "../../store/slices/userSlice";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

const useProfileScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [name, setName] = useState();
  const [surname, setSurname] = useState();
  const [photo, setPhoto] = useState(user?.photo);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [countryCode, setCountryCode] = useState(user?.phone.split(" ")[0] || "");
  const [email, setEmail] = useState(user?.email || "");
  const [image, setImage] = useState(null);

  const handleNameChange = (text) => {
    setName(text);
  };

  const handleSurnameChange = (text) => {
    setSurname(text);
  };

  const handlePhoneNumberChange = (text) => {
    setPhoneNumber(text);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
  };

  const handleCountryCodeChange = (text) => {
    setCountryCode(text);
  };

  const handleSaveChanges = async () => {
    let new_photo_url = photo;

    if (image) {
      new_photo_url = await sendImageToServer(image);
    }

    const userData = {
      details: {
        name: name ? name : user?.name.split(" ", 2)[0],
        surname: surname ? surname : user?.name.split(" ", 2)[1],
      },
      phone: countryCode + " " + phoneNumber,
      user_photo_url: new_photo_url,
      email,
    };

    try {
      dispatch(updateUserProfile({ userId: user.id, userData }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenImagePicker = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

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

      console.log("API Response:", response.data);
      return response.data.image.display_url;
    } catch (error) {
      console.error("API Error:", error.message);
      throw error; // Re-throw the error to handle it in the caller if needed.
    }
  };

  return {
    models: {
      user,
      name,
      surname,
      phoneNumber,
      countryCode,
      email,
      image
    },
    operations: {
      handleNameChange,
      handleSurnameChange,
      handlePhoneNumberChange,
      handleCountryCodeChange,
      handleEmailChange,
      handleSaveChanges,
      handleOpenImagePicker
    }
  };
};

export default useProfileScreen;
