import { useState } from "react";
import { useTextSearchQuery } from "../../../../models/places/useTextSearchQuery";
import { useDebounce } from "use-debounce";
import { useRef } from "react";
import { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { removeDiscountCode } from '../../../../store/slices/userSlice';
import { Alert } from "react-native";
import axios from "axios";

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API; //attt ao apagar

export const useConfirmationModal = (serviceId, close) => {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const [rating, setRating] = useState(0);

  const handleConfirmRate = () => {
    console.log(rating);
    if (user?.discount?.active) {
      const code = user.discount.promotion.code;
      dispatch(removeDiscountCode({ userId: user.id, code }));
    }

    addReview();
  };

  const addReview = async () => {
    try {
      console.log("serviceId", serviceId);
      const requestData = {
        rating: rating,
        comment: "",
      };
      const resp = await axios.put(
        `${IP}/service/${serviceId}/add-review`,
        requestData
      );
      console.log(resp.data);
      Alert.alert("Avaliação", "Avaliação enviada com sucesso", [
        {
          text: "OK",
          onPress: () => {
            close();
            setRating(0);
          },
        },
      ]);
    } catch (error) {
      console.error(error.message);
    }
  };
  const handleRate = (newRating) => {
    setRating(newRating);
  };
  return {
    models: {
      rating,
    },
    operations: {
      handleRate,
      handleConfirmRate,
    },
  };
};
