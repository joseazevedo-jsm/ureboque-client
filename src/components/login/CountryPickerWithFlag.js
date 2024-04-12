import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import CountryPicker from "react-native-country-picker-modal";
import { scale } from "react-native-size-matters";

const CountryPickerWithFlag = ({ onCallingCodeSelect }) => {
  const [country, setCountry] = useState({
    cca2: "AO",
    callingCode: "244",
    name: "Angola",
    flag: "🇦🇴",
  });

  const handleCountrySelect = (selectedCountry) => {
    setCountry(selectedCountry);
    onCallingCodeSelect(selectedCountry.callingCode);
  };

  return (
    <View >
      <CountryPicker
        withFlag
        withFilter
        withAlphaFilter
        onSelect={handleCountrySelect}
        countryCode={country?.cca2 ?? "AO"}
        selectedItem={country}
        translation="por"
        />
    </View>
  );
};

export default CountryPickerWithFlag;
