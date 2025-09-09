import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CountryPicker } from "react-native-country-codes-picker";
import { scale } from "react-native-size-matters";

const CountryPickerWithFlag = ({ onCallingCodeSelect }) => {
  const [show, setShow] = useState(false);
  const [countryCode, setCountryCode] = useState('+244');
  const [countryFlag, setCountryFlag] = useState('🇦🇴');

  const handleCountrySelect = (item) => {
    setCountryCode(item.dial_code);
    setCountryFlag(item.flag);
    onCallingCodeSelect(item.dial_code.replace('+', ''));
    setShow(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShow(true)}
      >
        <Text style={styles.flag}>{countryFlag}</Text>
        <Text style={styles.dialCode}>{countryCode}</Text>
      </TouchableOpacity>

      <CountryPicker
        show={show}
        pickerButtonOnPress={handleCountrySelect}
        onBackdropPress={() => setShow(false)}
        style={{
          modal: {
            height: 500,
          },
        }}
        searchMessage="Buscar país..."
        lang="pt"
      />
    </View>
  );
};

const styles = {
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    backgroundColor: '#f5f5f5',
    borderRadius: scale(5),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  flag: {
    fontSize: scale(18),
    marginRight: scale(8),
  },
  dialCode: {
    fontSize: scale(14),
    color: '#333',
    fontWeight: '500',
  },
};

export default CountryPickerWithFlag;
