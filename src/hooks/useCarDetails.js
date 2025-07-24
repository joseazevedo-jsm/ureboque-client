import { useState } from "react";
import { useSelector } from "react-redux";

/**
 * Hook to manage car details for towing service
 * @param {Function} onCarTypeChange - Callback when car type changes
 * @param {Function} onCarDetailsChange - Callback when car details change
 * @returns {Object} Car details state and functions
 */
export const useCarDetails = ({
  onCarTypeChange = () => {},
  onCarDetailsChange = () => {},
  initialCarType = "Turismo",
}) => {
  const { prices } = useSelector((state) => state.user);
  
  // Car type and pricing
  const [typeCar, setTypeCar] = useState(initialCarType);
  const [ridePrice, setRidePrice] = useState(null);
  
  // Car details
  const [brand, setBrand] = useState("Toyota");
  const [model, setModel] = useState("Corolla");
  const [license, setLicense] = useState("LD-10-10");
  const [color, setColor] = useState("Red");
  
  /**
   * Handle when car type is selected
   */
  const handleTypeCarPress = (type, price) => {
    setTypeCar(type);
    setRidePrice(price);
    onCarTypeChange({ type, price });
    
    return { type, price };
  };
  
  /**
   * Handle brand input change
   */
  const handleBrandInputValueChange = (value) => {
    setBrand(value);
    updateCarDetails({ brand: value });
  };
  
  /**
   * Handle model input change
   */
  const handleModelInputValueChange = (value) => {
    setModel(value);
    updateCarDetails({ model: value });
  };
  
  /**
   * Handle license plate input change
   */
  const handleLicenseInputValueChange = (value) => {
    setLicense(value);
    updateCarDetails({ license: value });
  };
  
  /**
   * Handle color input change
   */
  const handleColorInputValueChange = (value) => {
    setColor(value);
    updateCarDetails({ color: value });
  };
  
  /**
   * Update car details and notify parent component
   */
  const updateCarDetails = (changedDetail) => {
    const updatedDetails = {
      brand: changedDetail.brand !== undefined ? changedDetail.brand : brand,
      model: changedDetail.model !== undefined ? changedDetail.model : model,
      license: changedDetail.license !== undefined ? changedDetail.license : license,
      color: changedDetail.color !== undefined ? changedDetail.color : color,
    };
    
    onCarDetailsChange(updatedDetails);
  };
  
  /**
   * Reset car details
   */
  const resetCarDetails = () => {
    setBrand("");
    setModel("");
    setLicense("");
    setColor("");
    setTypeCar(initialCarType);
    setRidePrice(null);
  };
  
  /**
   * Check if all required car details are filled
   */
  const areCarDetailsFilled = () => {
    return (
      brand.trim() !== "" && 
      model.trim() !== "" && 
      license.trim() !== "" && 
      color.trim() !== ""
    );
  };
  
  /**
   * Get formatted car details string
   */
  const getFormattedCarDetails = () => {
    if (!areCarDetailsFilled()) return "";
    return `${brand} ${model}, ${color}, ${license}`;
  };
  
  /**
   * Get available car types and prices
   */
  const getAvailableCarTypes = () => {
    if (!prices || !prices.length) {
      // Default values if prices not loaded
      return [
        { type: "Turismo", price: "25,300" },
        { type: "Pick-up", price: "28,600" },
        { type: "Camião", price: "33,700" }
      ];
    }
    
    return prices.map(price => ({
      type: price.type,
      price: price.price.toString()
    }));
  };

  return {
    // State
    typeCar,
    ridePrice,
    brand,
    model,
    license,
    color,
    
    // Functions
    handleTypeCarPress,
    handleBrandInputValueChange,
    handleModelInputValueChange,
    handleLicenseInputValueChange,
    handleColorInputValueChange,
    resetCarDetails,
    areCarDetailsFilled,
    getFormattedCarDetails,
    getAvailableCarTypes,
    
    // Helpers
    isCarTypeSelected: !!typeCar,
    carDetailsFilled: areCarDetailsFilled()
  };
}; 