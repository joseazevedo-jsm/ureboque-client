import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Vibration,
  ActivityIndicator,
} from "react-native";
import { scale } from "react-native-size-matters";
import { UserContext } from "../context/UserContext";
import { useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { usePromotionScreen } from "../components/promotion/usePromotionScreen";
import DiscountItem from "../components/cards/discountItem";
import { KeyboardAvoidingView } from "react-native";
import { Platform } from "react-native";
import { useLogger } from "../hooks/useLogger";

const PromotionScreen = () => {
  const logger = useLogger('PromotionScreen', { enableLifecycleLogging: true });
  const { models, operations } = usePromotionScreen();
  const navigation = useNavigation();

  // Animation states
  const [isActivating, setIsActivating] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const inputScale = useRef(new Animated.Value(1)).current;

  logger.debug('PromotionScreen rendered', {
    hasActivePromo: !!(models.user?.discount?.active),
    promoCode: models.user?.discount?.code,
    discountsCount: models.discounts?.length || 0
  });

  const isPromoActive = models.user?.discount && models.user?.discount.active;

  // Entrance animation
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleActivateCode = async () => {
    if (models.code.trim() === '') return;

    setIsActivating(true);
    Vibration.vibrate([0, 100]);

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const result = await operations.handleActivateCode();

      if (result?.success) {
        // Success animation
        setSuccessVisible(true);
        Vibration.vibrate([0, 50, 50, 50]);

        setTimeout(() => {
          setSuccessVisible(false);
        }, 3000);
      }
    } catch (error) {
      logger.error('Error activating code', error);
      Vibration.vibrate([0, 200]);
    } finally {
      setIsActivating(false);
    }
  };

  const handleInputFocus = () => {
    setInputFocused(true);
    Animated.timing(inputScale, {
      toValue: 1.02,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleInputBlur = () => {
    setInputFocused(false);
    Animated.timing(inputScale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.openDrawer()}
            accessibilityLabel="Abrir menu"
            accessibilityRole="button"
          >
            <Icon name="menu" size={scale(24)} color="#0089FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PROMOÇÕES</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <Icon name="local-offer" size={scale(60)} color="#0089FF" />
          </View>
          <Text style={styles.heroTitle}>CÓDIGOS PROMOCIONAIS</Text>
          <Text style={styles.heroSubtitle}>
            Insira seu código promocional e economize nas suas viagens
          </Text>
        </Animated.View>

        {/* Active Promotion */}
        {isPromoActive && (
          <Animated.View style={[styles.activePromoSection, { opacity: fadeAnim }]}>
            <View style={styles.activePromoHeader}>
              <Icon name="check-circle" size={scale(24)} color="#4CAF50" />
              <Text style={styles.activePromoTitle}>Promoção Ativa</Text>
            </View>
            <DiscountItem
              code={models.user.discount.promotion.code}
              description={models.user.discount.promotion.description}
            />
          </Animated.View>
        )}

        {/* Input Section */}
        <Animated.View
          style={[
            styles.inputSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: inputScale }]
            }
          ]}
        >
          <Text style={styles.inputLabel}>Código Promocional:</Text>
          <View style={[
            styles.inputContainer,
            inputFocused && styles.inputContainerFocused,
            models.codeError && styles.inputContainerError
          ]}>
            <Icon
              name="confirmation-number"
              size={scale(20)}
              color={inputFocused ? "#0089FF" : "#6B6969"}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Inserir código promocional"
              placeholderTextColor="#999"
              value={models.code}
              onChangeText={operations.onCodeTextChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              editable={!isPromoActive}
              autoCapitalize="characters"
              accessibilityLabel="Campo de código promocional"
            />
          </View>

          {models.codeError && (
            <Animated.View style={styles.errorContainer}>
              <Icon name="error" size={scale(16)} color="#f44336" />
              <Text style={styles.errorText}>{models.codeError}</Text>
            </Animated.View>
          )}

          {successVisible && (
            <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
              <Icon name="check-circle" size={scale(16)} color="#4CAF50" />
              <Text style={styles.successText}>Código aplicado com sucesso!</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Action Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isPromoActive && styles.disabledButton,
              (isActivating || models.code.trim() === '') && styles.disabledButton
            ]}
            onPress={handleActivateCode}
            disabled={isPromoActive || isActivating || models.code.trim() === ''}
            accessibilityLabel="Ativar código promocional"
            accessibilityRole="button"
          >
            {isActivating ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>ATIVANDO...</Text>
              </>
            ) : (
              <>
                <Icon name="add-circle" size={scale(20)} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  {isPromoActive ? 'PROMOÇÃO ATIVA' : 'ATIVAR CÓDIGO'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Icon name="help-outline" size={scale(28)} color="#0089FF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Como usar:</Text>
              <View style={styles.stepsList}>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Digite o código promocional no campo acima</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Toque em "ATIVAR CÓDIGO" para aplicar</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>O desconto será aplicado automaticamente na próxima viagem</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Slate 50
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(24),
    paddingTop: scale(60),
    paddingBottom: scale(20),
    backgroundColor: "transparent",
  },
  backButton: {
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: scale(40),
  },
  heroSection: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(30),
    alignItems: "center",
    marginBottom: scale(10),
  },
  iconContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: "#E0F2FE", // Light Blue
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(20),
    shadowColor: "#0089FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTitle: {
    fontSize: scale(22),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: scale(8),
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: scale(15),
    color: "#64748B",
    textAlign: "center",
    lineHeight: scale(22),
    paddingHorizontal: scale(20),
  },
  activePromoSection: {
    backgroundColor: "#fff",
    marginHorizontal: scale(24),
    borderRadius: scale(16),
    padding: scale(20),
    marginBottom: scale(24),
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: scale(4),
    borderLeftColor: "#4CAF50",
  },
  activePromoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(12),
  },
  activePromoTitle: {
    fontSize: scale(16),
    fontWeight: "700",
    color: "#4CAF50",
    marginLeft: scale(10),
  },
  inputSection: {
    marginHorizontal: scale(24),
    marginBottom: scale(24),
  },
  inputLabel: {
    fontSize: scale(13),
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: scale(10),
    marginLeft: scale(4),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderRadius: scale(14),
    paddingHorizontal: scale(16),
    paddingVertical: scale(4), // Balance for text input height
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: "#0089FF",
    backgroundColor: "#fff",
    shadowColor: "#0089FF",
    shadowOpacity: 0.1,
  },
  inputContainerError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: scale(12),
  },
  textInput: {
    flex: 1,
    fontSize: scale(16),
    color: "#1E293B",
    fontWeight: '600',
    paddingVertical: scale(12),
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(10),
    paddingHorizontal: scale(4),
  },
  errorText: {
    fontSize: scale(13),
    color: "#EF4444",
    marginLeft: scale(8),
    flex: 1,
    fontWeight: '500',
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(10),
    paddingHorizontal: scale(4),
  },
  successText: {
    fontSize: scale(14),
    color: "#4CAF50",
    marginLeft: scale(8),
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    backgroundColor: "#0089FF",
    borderRadius: scale(16),
    paddingVertical: scale(16),
    paddingHorizontal: scale(30),
    marginHorizontal: scale(24),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(30),
    shadowColor: "#0089FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: "#CBD5E0",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: scale(10),
  },
  buttonText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  infoSection: {
    paddingHorizontal: scale(24),
    marginBottom: scale(40),
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: scale(16),
    padding: scale(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconContainer: {
    marginBottom: scale(16),
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: scale(16),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: scale(16),
  },
  stepsList: {
    gap: scale(16),
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
    marginTop: scale(2),
  },
  stepNumberText: {
    fontSize: scale(12),
    fontWeight: "700",
    color: "#0089FF",
  },
  stepText: {
    fontSize: scale(14),
    color: "#64748B",
    lineHeight: scale(20),
    flex: 1,
  },
  footerSpace: {
    height: scale(40),
  },
});

export default PromotionScreen;
