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
      await operations.handleActivateCode();
      
      if (!models.codeError) {
        // Success animation
        setSuccessVisible(true);
        Vibration.vibrate([0, 50, 50, 50]);
        
        setTimeout(() => {
          setSuccessVisible(false);
        }, 3000);
      } else {
        // Error haptic
        Vibration.vibrate([0, 200]);
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
            onPress={() => navigation.goBack()}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
          >
            <Icon name="arrow-back" size={scale(24)} color="#0089FF" />
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
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: scale(50),
    paddingBottom: scale(20),
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: "#f0f8ff",
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#0089FF",
    textAlign: "center",
  },
  headerSpacer: {
    width: scale(40),
  },
  heroSection: {
    backgroundColor: "#fff",
    paddingHorizontal: scale(20),
    paddingVertical: scale(40),
    alignItems: "center",
    marginBottom: scale(20),
  },
  iconContainer: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(20),
  },
  heroTitle: {
    fontSize: scale(24),
    fontWeight: "bold",
    color: "#0089FF",
    marginBottom: scale(10),
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: scale(16),
    color: "#666",
    textAlign: "center",
    lineHeight: scale(22),
  },
  activePromoSection: {
    backgroundColor: "#fff",
    marginHorizontal: scale(20),
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: scale(20),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: scale(4),
    borderLeftColor: "#4CAF50",
  },
  activePromoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(15),
  },
  activePromoTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#4CAF50",
    marginLeft: scale(10),
  },
  inputSection: {
    backgroundColor: "#fff",
    marginHorizontal: scale(20),
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: scale(20),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputLabel: {
    fontSize: scale(16),
    fontWeight: "600",
    color: "#333",
    marginBottom: scale(15),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: scale(12),
    paddingHorizontal: scale(15),
    paddingVertical: scale(12),
    backgroundColor: "#fafafa",
  },
  inputContainerFocused: {
    borderColor: "#0089FF",
    backgroundColor: "#f0f8ff",
    elevation: 2,
    shadowColor: "#0089FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainerError: {
    borderColor: "#f44336",
    backgroundColor: "#fff5f5",
  },
  inputIcon: {
    marginRight: scale(10),
  },
  textInput: {
    flex: 1,
    fontSize: scale(16),
    color: "#333",
    paddingVertical: 0,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(10),
    paddingHorizontal: scale(5),
  },
  errorText: {
    fontSize: scale(14),
    color: "#f44336",
    marginLeft: scale(8),
    flex: 1,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(10),
    paddingHorizontal: scale(5),
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
    borderRadius: scale(12),
    paddingVertical: scale(18),
    paddingHorizontal: scale(30),
    marginHorizontal: scale(20),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(20),
    elevation: 4,
    shadowColor: "#0089FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonIcon: {
    marginRight: scale(10),
  },
  buttonText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  infoSection: {
    paddingHorizontal: scale(20),
    marginBottom: scale(20),
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: scale(12),
    padding: scale(20),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: scale(4),
    borderLeftColor: "#0089FF",
  },
  infoIconContainer: {
    alignSelf: "flex-start",
    marginBottom: scale(15),
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#333",
    marginBottom: scale(15),
    textAlign: "center",
  },
  stepsList: {
    gap: scale(12),
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: scale(8),
  },
  stepNumber: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "#0089FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
    marginTop: scale(2),
  },
  stepNumberText: {
    fontSize: scale(12),
    fontWeight: "bold",
    color: "#fff",
  },
  stepText: {
    fontSize: scale(15),
    color: "#555",
    lineHeight: scale(22),
    flex: 1,
    marginTop: scale(2),
  },
  footerSpace: {
    height: scale(40),
  },
});

export default PromotionScreen;
