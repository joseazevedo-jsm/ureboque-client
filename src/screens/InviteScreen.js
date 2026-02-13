import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  Share,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useInviteScreen } from "../components/invite/useInviteScreen";
import { useLogger } from "../hooks/useLogger";
import { useAlert } from "../context/AlertContext";
// New Design Dependencies
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  ZoomIn
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get('window');

// --- Custom Animated Components ---

const ScalePressable = ({ children, style, onPress, disabled }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.95);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- InviteScreen Component ---

const InviteScreen = () => {
  const logger = useLogger('InviteScreen', { enableLifecycleLogging: true });
  const { models, operations } = useInviteScreen();
  const navigation = useNavigation();
  const { showAlert } = useAlert();

  // Animation states
  const [isSharing, setIsSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyCode = () => {
    if (models.inviteCode) {
      // Premium Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Clipboard.setString(models.inviteCode);
      setCopySuccess(true);

      // Reset success state
      setTimeout(() => setCopySuccess(false), 2000);

      logger.info('Invite code copied to clipboard');
    }
  };

  const handleShare = async () => {
    try {
      if (models.inviteCode) {
        setIsSharing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const result = await Share.share({
          message: `🚗 Use meu código ${models.inviteCode} no Ureboque e ganhe 30% de desconto na sua primeira viagem! \n\n📱 Baixe o app agora e economize na sua próxima corrida!`,
          title: 'Convite Ureboque - 30% OFF'
        });

        if (result.action === Share.sharedAction) {
          logger.info('Invite code shared successfully');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      logger.error('Error sharing invite code', error);
      showAlert({ type: 'error', title: 'Erro', message: 'Não foi possível compartilhar o código' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#F8FAFC', '#E2E8F0']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.openDrawer()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="menu" size={scale(24)} color="#0089FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Convidar Amigos</Text>
          <View style={{ width: scale(24) }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Hero Section */}
          <Animated.View
            entering={FadeInDown.delay(100).springify().damping(12)}
            style={styles.heroContainer}
          >
            <LinearGradient
              colors={['#0089FF', '#0055FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.iconCircle}>
                <Icon name="card-giftcard" size={scale(32)} color="#0089FF" />
              </View>
              <Text style={styles.heroTitle}>Convide e Ganhe</Text>
              <Text style={styles.heroSubtitle}>
                Compartilhe o Ureboque com amigos.{"\n"}Todo mundo sai ganhando!
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Benefits Section */}
          <View style={styles.benefitsContainer}>
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <View style={styles.benefitRow}>
                <View style={[styles.benefitIcon, { backgroundColor: '#E0F2FE' }]}>
                  <Icon name="person-add" size={scale(24)} color="#0284C7" />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>Seu amigo ganha 30%</Text>
                  <Text style={styles.benefitDesc}>De desconto na primeira viagem</Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <View style={styles.benefitRow}>
                <View style={[styles.benefitIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Icon name="monetization-on" size={scale(24)} color="#16A34A" />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>Você ganha 50%</Text>
                  <Text style={styles.benefitDesc}>Assim que ele completar a viagem</Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Invite Code Section */}
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={styles.codeSection}
          >
            <Text style={styles.codeLabel}>Seu código de convite</Text>

            <View style={styles.codeCard}>
              {models.isLoading ? (
                <ActivityIndicator color="#0089FF" />
              ) : (
                <View style={styles.codeInner}>
                  <Text style={[styles.codeText, { opacity: models.inviteCode ? 1 : 0.3 }]}>
                    {models.inviteCode || "UNAVAILABLE"}
                  </Text>

                  <ScalePressable
                    onPress={handleCopyCode}
                    disabled={!models.inviteCode}
                    style={[styles.copyButton, copySuccess && styles.copyButtonSuccess]}
                  >
                    <Icon
                      name={copySuccess ? "check" : "content-copy"}
                      size={scale(20)}
                      color={copySuccess ? "#16A34A" : "#0089FF"}
                    />
                    <Text style={[styles.copyButtonText, copySuccess && styles.copyTextSuccess]}>
                      {copySuccess ? "Copiado" : "Copiar"}
                    </Text>
                  </ScalePressable>
                </View>
              )}
            </View>
            {models.error && (
              <Text style={styles.errorText}>Não foi possível carregar o código.</Text>
            )}
          </Animated.View>

          {/* Action Button */}
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            style={styles.actionContainer}
          >
            <ScalePressable
              onPress={handleShare}
              disabled={!models.inviteCode || isSharing}
              style={[styles.mainButton, (!models.inviteCode) && styles.disabledMainButton]}
            >
              <LinearGradient
                colors={!models.inviteCode ? ['#CBD5E1', '#94A3B8'] : ['#0089FF', '#0055FF']}
                style={styles.mainButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSharing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Icon name="share" size={scale(20)} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.mainButtonText}>Compartilhar Código</Text>
                  </>
                )}
              </LinearGradient>
            </ScalePressable>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Slate 50
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(24),
    paddingTop: scale(60), // SafeArea handles top, just need some breathing room
    paddingBottom: scale(20),
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 0.5,
  },
  backButton: {
    padding: scale(8),
    backgroundColor: '#fff',
    borderRadius: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingBottom: scale(40),
  },
  heroContainer: {
    paddingHorizontal: scale(24),
    marginTop: scale(16),
    marginBottom: scale(32),
  },
  heroCard: {
    borderRadius: scale(24),
    padding: scale(24),
    alignItems: 'center',
    shadowColor: "#0055FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTitle: {
    fontSize: scale(24),
    fontWeight: "800",
    color: "white",
    marginBottom: scale(8),
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: scale(15),
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: scale(22),
    paddingHorizontal: scale(20),
  },
  benefitsContainer: {
    paddingHorizontal: scale(24),
    marginBottom: scale(32),
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(16),
    backgroundColor: '#fff',
    padding: scale(16),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: scale(16),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: scale(13),
    color: "#64748B",
    lineHeight: scale(18),
  },
  codeSection: {
    paddingHorizontal: scale(24),
    marginBottom: scale(32),
  },
  codeLabel: {
    fontSize: scale(14),
    fontWeight: "700",
    color: "#64748B",
    marginBottom: scale(12),
    marginLeft: scale(4),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeCard: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scale(64),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  codeInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: scale(20),
  },
  codeText: {
    fontSize: scale(22),
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: scale(10),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    marginRight: scale(6),
  },
  copyButtonSuccess: {
    backgroundColor: '#f0fdf4',
  },
  copyButtonText: {
    fontSize: scale(13),
    fontWeight: "700",
    color: "#0089FF",
    marginLeft: scale(6),
  },
  copyTextSuccess: {
    color: "#16A34A",
  },
  actionContainer: {
    paddingHorizontal: scale(24),
  },
  mainButton: {
    borderRadius: scale(16),
    overflow: 'hidden',
    shadowColor: "#0089FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledMainButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  mainButtonGradient: {
    paddingVertical: scale(18),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonText: {
    fontSize: scale(16),
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: scale(13),
    marginTop: scale(12),
    textAlign: 'center',
    fontWeight: '500',
  }
});

export default InviteScreen;
