import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { scale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import { colors, shadows, spacing, borderRadius } from "../../theme";

const FIELDS = [
  { key: "brand",   label: "Marca",      placeholder: "Ex: Toyota",  autoCapitalize: "words",      returnKeyType: "next" },
  { key: "model",   label: "Modelo",     placeholder: "Ex: Corolla", autoCapitalize: "words",      returnKeyType: "next" },
  { key: "license", label: "Matrícula",  placeholder: "LD-00-00",    autoCapitalize: "characters", returnKeyType: "next" },
  { key: "color",   label: "Cor",        placeholder: "Ex: Branco",  autoCapitalize: "words",      returnKeyType: "done" },
];

const HANDLERS = {
  brand:   (ops) => ops.handleBrandInputValueChange,
  model:   (ops) => ops.handleModelInputValueChange,
  license: (ops) => ops.handleLicenseInputValueChange,
  color:   (ops) => ops.handleColorInputValueChange,
};

const UserCarInfo = ({
  handleBrandInputValueChange,
  handleModelInputValueChange,
  handleLicenseInputValueChange,
  handleColorInputValueChange,
  handleConfirmButtonPress,
  initialValues = {},
  defaultSaveChecked = false,
}) => {
  const handlers = {
    handleBrandInputValueChange,
    handleModelInputValueChange,
    handleLicenseInputValueChange,
    handleColorInputValueChange,
  };

  const [errors, setErrors] = React.useState({});
  const [saveVehicle, setSaveVehicle] = React.useState(defaultSaveChecked);
  const [formData, setFormData] = React.useState({
    brand: initialValues.brand || '',
    model: initialValues.model || '',
    license: initialValues.license || '',
    color: initialValues.color || '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    HANDLERS[field](handlers)(value);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.brand.trim())   newErrors.brand   = "Marca é obrigatória";
    if (!formData.model.trim())   newErrors.model   = "Modelo é obrigatório";
    if (!formData.color.trim())   newErrors.color   = "Cor é obrigatória";
    if (!formData.license.trim()) {
      newErrors.license = "Matrícula é obrigatória";
    } else if (!/^[A-Z0-9-]{5,9}$/.test(formData.license.trim())) {
      newErrors.license = "Matrícula inválida";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onConfirmPress = () => {
    if (validate()) handleConfirmButtonPress(saveVehicle);
  };

  // Render two inputs side-by-side per row
  const rows = [FIELDS.slice(0, 2), FIELDS.slice(2, 4)];

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="directions-car" size={scale(22)} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>Qual carro vai rebocar?</Text>
          <Text style={styles.subtitle}>Preencha os dados do veículo</Text>
        </View>
      </View>

      {/* Form grid */}
      <View style={styles.form}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map(({ key, label, placeholder, autoCapitalize, returnKeyType }) => (
              <View key={key} style={styles.fieldGroup}>
                <Text style={styles.label}>{label}</Text>
                <BottomSheetTextInput
                  style={[styles.input, errors[key] && styles.inputError]}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textMuted}
                  defaultValue={formData[key]}
                  autoCapitalize={autoCapitalize}
                  onChangeText={(v) => handleChange(key, v)}
                  blurOnSubmit={false}
                  returnKeyType={returnKeyType}
                />
                {errors[key] ? (
                  <Text style={styles.errorText}>{errors[key]}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Save vehicle toggle — only shown on first car */}
      {defaultSaveChecked && (
        <TouchableOpacity
          style={styles.saveToggleRow}
          onPress={() => setSaveVehicle((v) => !v)}
          activeOpacity={0.7}
        >
          <Icon
            name={saveVehicle ? "bookmark" : "bookmark-border"}
            size={scale(18)}
            color={saveVehicle ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.saveToggleLabel, saveVehicle && styles.saveToggleLabelActive]}>
            Guardar veículo
          </Text>
        </TouchableOpacity>
      )}

      {/* Confirm button */}
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={onConfirmPress}
        activeOpacity={0.85}
      >
        <Text style={styles.confirmButtonText}>Confirmar</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  headerIcon: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(14),
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  title: {
    fontSize: scale(15),
    color: colors.textPrimary,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: scale(12),
    color: colors.textMuted,
    marginTop: scale(2),
    fontWeight: "500",
  },

  // Form
  form: {
    paddingBottom:spacing.xl
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  fieldGroup: {
    flex: 1,
  },
  label: {
    fontSize: scale(12),
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: scale(6),
  },
  input: {
    height: scale(50),
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: scale(14),
    color: colors.textPrimary,
    ...shadows.sm,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    color: colors.error,
    fontSize: scale(11),
    marginTop: scale(4),
    fontWeight: "500",
  },

  // Save toggle
  saveToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  saveToggleLabel: {
    fontSize: scale(12),
    fontWeight: '600',
    color: colors.textMuted,
  },
  saveToggleLabelActive: {
    color: colors.primary,
  },

  // Button
  confirmButton: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    paddingVertical: scale(14),
    marginBottom: spacing.lg,
    ...shadows.primaryGlow,
  },
  confirmButtonText: {
    color: colors.surface,
    fontSize: scale(16),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default UserCarInfo;
