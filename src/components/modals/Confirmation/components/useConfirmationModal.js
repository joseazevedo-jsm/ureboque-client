import { useContext, useState } from "react";
import { useTextSearchQuery } from "../../../../models/places/useTextSearchQuery";
import { useDebounce } from "use-debounce";
import { useRef } from "react";
import { useEffect } from "react";
import { UserContext } from "../../../../context/UserContext";
import { useUserData } from "../../../../context/UserDataContext";
import { useLogger } from "../../../../hooks/useLogger";
import { Alert } from "react-native";
import axios from "axios";

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API; //attt ao apagar

export const useConfirmationModal = (lastService, close) => {
  const logger = useLogger('useConfirmationModal');
  const { user, removeDiscount } = useContext(UserContext);
  const { services, setServices } = useUserData();
  const [rating, setRating] = useState(0);

  const handleConfirmRate = () => {
    logger.info('Confirming rating', { rating });
    if (user?.discount?.active) {
      const code = user.discount.promotion.code;
      removeDiscount(code);
    }

    addReview();
  };

  const addReview = async () => {
    try {
      logger.info('Adding review', { serviceId: lastService?.service?._id, rating });
      const requestData = {
        rating: rating,
        comment: "",
      };
      const resp = await axios.put(
        `${IP}/service/${lastService?.service?._id}/add-review`,
        requestData
      );
      logger.info('Review submitted successfully', { reviewData: resp.data });
      
      // Add the completed service to local services state using existing lastService data
      if (lastService?.service && resp.data) {
        logger.info('Adding completed service to local state', { serviceId: lastService.service._id });
        
        // Create the service item with the structure expected by history screen
        const serviceItem = {
          service: {
            ...lastService.service,
            driver: {
              _id: lastService.driver?.driverId || lastService.driver?.id,
              details: {
                name: lastService.driver?.name?.split(' ')[0] || 'N/A',
                surname: lastService.driver?.name?.split(' ').slice(1).join(' ') || ''
              },
              user_photo_url: lastService.driver?.photo,
            },
            status: 'completed',
            review: {
              rating: rating,
              comment: ""
            }
          },
          car: {
            brand: lastService.driver?.car?.name?.split(' ')[0] || 'N/A',
            model: lastService.driver?.car?.name?.split(' ')[1] || 'N/A', 
            color: lastService.driver?.car?.color || 'N/A',
            licensePlate: lastService.driver?.car?.licensePlate || 'N/A'
          }
        };
        
        logger.info('Service item structure created', { serviceItem });
        
        // Add to the beginning of services array (most recent first)
        setServices(prevServices => [serviceItem, ...prevServices]);
      }
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
      logger.error('Error submitting review', error);
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
