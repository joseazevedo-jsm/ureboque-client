import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { scale } from "react-native-size-matters";
import { colors, shadows, spacing, borderRadius } from "../../theme";

const UserCarInfo = ({
  handleBrandInputValueChange,
  handleModelInputValueChange,
  handleLicenseInputValueChange,
  handleColorInputValueChange,
  handleConfirmButtonPress,
}) => {
  const [errors, setErrors] = React.useState({
    brand: '',
    model: '',
    license: '',
    color: ''
  });

  const [formData, setFormData] = React.useState({
    brand: 'Toyota',
    model: 'Corolla',
    license: 'LD-10-10',
    color: 'Preto'
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!formData.brand.trim()) {
      newErrors.brand = 'Marca é obrigatória';
      isValid = false;
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Modelo é obrigatório';
      isValid = false;
    }

    if (!formData.license.trim()) {
      newErrors.license = 'Matrícula é obrigatória';
      isValid = false;
    } else if (!/^[A-Z0-9-]{6,8}$/.test(formData.license.trim())) {
      newErrors.license = 'Matrícula inválida';
      isValid = false;
    }

    if (!formData.color.trim()) {
      newErrors.color = 'Cor é obrigatória';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));

    // Call the original handlers
    switch (field) {
      case 'brand':
        handleBrandInputValueChange(value);
        break;
      case 'model':
        handleModelInputValueChange(value);
        break;
      case 'license':
        handleLicenseInputValueChange(value);
        break;
      case 'color':
        handleColorInputValueChange(value);
        break;
    }
  };

  const onConfirmPress = () => {
    if (validateForm()) {
      handleConfirmButtonPress();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        QUAL CARRO VAI REBOCAR?
      </Text>

      <View style={styles.containerInputs}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <BottomSheetTextInput
              onChangeText={(value) => handleInputChange('brand', value)}
              style={[styles.input, errors.brand && styles.inputError]}
              placeholder="Marca"
              placeholderTextColor={colors.textPrimary}
              blurOnSubmit={false}
              returnKeyType="next"
            />
            {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <BottomSheetTextInput
              onChangeText={(value) => handleInputChange('model', value)}
              style={[styles.input, errors.model && styles.inputError]}
              placeholder="Modelo"
              placeholderTextColor={colors.textPrimary}
              blurOnSubmit={false}
              returnKeyType="next"
            />
            {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <BottomSheetTextInput
              onChangeText={(value) => handleInputChange('license', value)}
              style={[styles.input, errors.license && styles.inputError]}
              placeholder="Matricula"
              placeholderTextColor={colors.textPrimary}
              autoCapitalize="characters"
              blurOnSubmit={false}
              returnKeyType="next"
            />
            {errors.license && <Text style={styles.errorText}>{errors.license}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <BottomSheetTextInput
              onChangeText={(value) => handleInputChange('color', value)}
              style={[styles.input, errors.color && styles.inputError]}
              placeholder="Cor"
              placeholderTextColor={colors.textPrimary}
              blurOnSubmit={false}
              returnKeyType="done"
            />
            {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={onConfirmPress}
      >
        <Text style={styles.buttonText}>Confirmar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    flex: 1,
    backgroundColor: 'transparent',
  },
  button: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    marginHorizontal: scale(10),
    paddingVertical: scale(14),
    ...shadows.primaryGlow,
  },
  input: {
    height: scale(54),
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.xs,
    fontSize: scale(15),
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  containerInputs: {
    marginBottom: scale(10),
  },
  title: {
    fontSize: scale(16),
    alignSelf: "center",
    color: colors.primary,
    fontWeight: "800",
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: scale(11),
    marginTop: spacing.xs,
    marginLeft: scale(10),
    fontWeight: '600',
  },
  buttonText: {
    color: colors.surface,
    fontSize: scale(16),
    fontWeight: "700",
    letterSpacing: 0.5,
  }
});

export default UserCarInfo;
