import { useContext, useState } from "react";
import { UserContext } from "../../context/UserContext"; // Import your UserContext here
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

const useProfileScreen = () => {
  const { user, updateUser } = useContext(UserContext);
  const [name, setName] = useState();
  const [surname, setSurname] = useState();
  const [photo, setPhoto] = useState(user?.photo);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
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

  const handleSaveChanges = async () => {
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

    try {
      await updateUser(user.id,userData); // Update the user data without specifying 'user.id'
    } catch (error) {
      console.error(error);
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

    console.log(result.assets[0]);
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
      email,
      image,
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
