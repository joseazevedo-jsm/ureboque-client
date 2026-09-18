import React from "react";
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';

import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { scale } from "react-native-size-matters";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { colors, shadows, spacing, borderRadius, borderWidths, typography, sizes } from "../../theme";

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
          <Icon name="directions-car" size={sizes.iconLarge} color={colors.primary} />
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
            size={sizes.icon}
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
    width: sizes.control,
    height: sizes.control,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: sizes.control,
    borderRadius: borderRadius.md,
    borderWidth: borderWidths.thin,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: borderWidths.focus,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    marginTop: spacing.xs,
    fontWeight: "500",
  },

  // Save toggle
  saveToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.control,
    marginBottom: spacing.sm,
  },
  saveToggleLabel: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: '600',
    color: colors.textMuted,
  },
  saveToggleLabelActive: {
    color: colors.primary,
  },

  // Button
  confirmButton: {
    minHeight: sizes.controlLarge,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  confirmButtonText: {
    color: colors.surface,
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default UserCarInfo;
