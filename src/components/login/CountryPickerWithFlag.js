import { spacing, componentStyles, colors, typography } from '../../theme';
import React, { useState } from "react";
import { View } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';

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
        accessibilityLabel={`Escolher país, código atual ${countryCode}`}
        accessibilityState={{ expanded: show }}
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
    ...componentStyles.input,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  flag: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    marginRight: spacing.sm,
  },
  dialCode: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textPrimary,
    fontWeight: '500',
  },
};

export default CountryPickerWithFlag;
