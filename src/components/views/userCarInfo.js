import React from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
   Platform,
} from "react-native";
import { scale } from "react-native-size-matters";

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
    brand: '',
    model: '',
    license: '',
    color: ''
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
    switch(field) {
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
              placeholderTextColor={"#000"}
            />
            {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <BottomSheetTextInput
              onChangeText={(value) => handleInputChange('model', value)}
              style={[styles.input, errors.model && styles.inputError]}
              placeholder="Modelo"
              placeholderTextColor={"#000"}
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
              placeholderTextColor={"#000"}
              autoCapitalize="characters"
            />
            {errors.license && <Text style={styles.errorText}>{errors.license}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <BottomSheetTextInput
              onChangeText={(value) => handleInputChange('color', value)}
              style={[styles.input, errors.color && styles.inputError]}
              placeholder="Cor"
              placeholderTextColor={"#000"}
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
    paddingHorizontal: scale(20),
    flex: 1,
  },
  button: {
    borderRadius: scale(7),
    backgroundColor: "#0089ff",
    alignItems: "center",
    marginHorizontal: scale(10),
    paddingVertical: scale(10),
  },
  input: {
    height: scale(50),
    borderRadius: scale(7),
    borderWidth: scale(4),
    borderColor: "#0089ff",
    paddingHorizontal: scale(10),
    marginHorizontal: scale(5),
  },
  row: {
    flexDirection: "row",
    marginBottom: scale(20),
    paddingHorizontal: scale(5),
  },
  containerInputs: {
    marginBottom: scale(10),
  },
  title: {
    fontSize: scale(18),
    alignSelf: "center",
    color: "#0089FF",
    fontWeight: "900",
    paddingVertical: scale(10),
  },
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: scale(12),
    marginTop: scale(2),
    marginLeft: scale(10),
  },
  buttonText: {
    color: "#fff",
    fontSize: scale(18)
  }
});

export default UserCarInfo;
