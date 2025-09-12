import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  Alert,
  Share,
  Animated,
  Vibration,
  ActivityIndicator,
} from "react-native";
import { scale } from "react-native-size-matters";
import { UserContext } from "../context/UserContext";
import { useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useInviteScreen } from "../components/invite/useInviteScreen";
import { useLogger } from "../hooks/useLogger";

const InviteScreen = () => {
  const logger = useLogger('InviteScreen', { enableLifecycleLogging: true });
  const { models, operations } = useInviteScreen();
  const navigation = useNavigation();
  
  // Animation states
  const [isSharing, setIsSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const copyButtonScale = useRef(new Animated.Value(1)).current;
  const shareButtonScale = useRef(new Animated.Value(1)).current;
  
  logger.debug('InviteScreen rendered', {
    hasInviteCode: !!models.inviteCode,
    userId: models.user?.id,
    isLoading: models.isLoading,
    hasError: !!models.error
  });

  // Entrance animation
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateButton = (animValue, callback) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleCopyCode = () => {
    if (models.inviteCode) {
      // Haptic feedback
      Vibration.vibrate([0, 50]);
      
      // Button animation
      animateButton(copyButtonScale);
      
      Clipboard.setString(models.inviteCode);
      setCopySuccess(true);
      
      // Success animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Reset success state
      setTimeout(() => setCopySuccess(false), 2000);
      
      logger.info('Invite code copied to clipboard');
    }
  };

  const handleShare = async () => {
    try {
      if (models.inviteCode) {
        setIsSharing(true);
        
        // Haptic feedback
        Vibration.vibrate([0, 100, 50, 100]);
        
        // Button animation
        animateButton(shareButtonScale);
        
        const result = await Share.share({
          message: `🚗 Use meu código ${models.inviteCode} no Ureboque e ganhe 30% de desconto na sua primeira viagem! 

📱 Baixe o app agora e economize na sua próxima corrida!

#Ureboque #Desconto #Transporte`,
          title: 'Convite Ureboque - 30% OFF'
        });
        
        if (result.action === Share.sharedAction) {
          logger.info('Invite code shared successfully');
          // Success haptic
          Vibration.vibrate([0, 50, 50, 50]);
        }
      }
    } catch (error) {
      logger.error('Error sharing invite code', error);
      Alert.alert("Erro", "Não foi possível compartilhar o código");
      // Error haptic
      Vibration.vibrate([0, 200]);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
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
          <Text style={styles.headerTitle}>CONVIDAR AMIGOS</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Hero Section */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
            <Icon name="share" size={scale(60)} color="#0089FF" />
          </Animated.View>
          <Text style={styles.heroTitle}>CONVIDE E GANHE</Text>
          <Text style={styles.heroSubtitle}>
            Compartilhe com amigos e ambos ganham descontos especiais!
          </Text>
        </Animated.View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Icon name="person-add" size={scale(28)} color="#0089FF" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Seu amigo ganha 30%</Text>
              <Text style={styles.benefitDescription}>
                Desconto na primeira viagem ao usar seu código
              </Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Icon name="card-giftcard" size={scale(28)} color="#0089FF" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Você ganha 50%</Text>
              <Text style={styles.benefitDescription}>
                Desconto quando seu amigo completar a primeira viagem
              </Text>
            </View>
          </View>
        </View>

        {/* Invite Code Section */}
        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>Seu código de convite:</Text>
          <View style={styles.codeContainer}>
            {models.error ? (
              <View style={styles.errorContainer}>
                <Icon name="error" size={scale(20)} color="#f44336" />
                <Text style={styles.errorText}>{models.error}</Text>
              </View>
            ) : models.isLoading ? (
              <View style={styles.skeletonContainer}>
                <ActivityIndicator size="small" color="#0089FF" />
                <Text style={styles.loadingText}>Carregando código...</Text>
              </View>
            ) : models.inviteCode ? (
              <Text style={styles.codeText}>{models.inviteCode}</Text>
            ) : (
              <View style={styles.skeletonContainer}>
                <View style={styles.skeletonText} />
              </View>
            )}
            <Animated.View style={{ transform: [{ scale: copyButtonScale }] }}>
              <TouchableOpacity 
                style={[
                  styles.copyButton,
                  copySuccess && styles.copyButtonSuccess
                ]}
                onPress={handleCopyCode}
                disabled={!models.inviteCode}
                accessibilityLabel="Copiar código"
                accessibilityRole="button"
              >
                <Icon 
                  name={copySuccess ? "check" : "content-copy"} 
                  size={scale(20)} 
                  color={copySuccess ? "#4CAF50" : "#0089FF"} 
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
          {copySuccess && (
            <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
              <Icon name="check-circle" size={scale(16)} color="#4CAF50" />
              <Text style={styles.successText}>Código copiado!</Text>
            </Animated.View>
          )}
          {models.error && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={operations.retryGetInviteCode}
              accessibilityLabel="Tentar novamente"
              accessibilityRole="button"
            >
              <Icon name="refresh" size={scale(18)} color="#0089FF" />
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Share Button */}
        <Animated.View style={{ transform: [{ scale: shareButtonScale }] }}>
          <TouchableOpacity 
            style={[
              styles.shareButton, 
              (!models.inviteCode || isSharing || models.isLoading || models.error) && styles.disabledButton
            ]}
            onPress={handleShare}
            disabled={!models.inviteCode || isSharing || models.isLoading || models.error}
            accessibilityLabel="Compartilhar código de convite"
            accessibilityRole="button"
          >
            {isSharing ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={styles.shareIcon} />
                <Text style={styles.shareButtonText}>COMPARTILHANDO...</Text>
              </>
            ) : (
              <>
                <Icon name="share" size={scale(20)} color="#fff" style={styles.shareIcon} />
                <Text style={styles.shareButtonText}>COMPARTILHAR CÓDIGO</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
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
    fontSize: scale(28),
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
  benefitsSection: {
    paddingHorizontal: scale(20),
    marginBottom: scale(20),
  },
  benefitCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: scale(15),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  benefitIcon: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(15),
  },
  benefitContent: {
    flex: 1,
    justifyContent: "center",
  },
  benefitTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#333",
    marginBottom: scale(5),
  },
  benefitDescription: {
    fontSize: scale(14),
    color: "#666",
    lineHeight: scale(20),
  },
  codeSection: {
    backgroundColor: "#fff",
    marginHorizontal: scale(20),
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: scale(30),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  codeLabel: {
    fontSize: scale(16),
    color: "#333",
    marginBottom: scale(15),
    fontWeight: "600",
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: scale(8),
    borderWidth: 2,
    borderColor: "#0089FF",
    paddingHorizontal: scale(15),
    paddingVertical: scale(12),
  },
  codeText: {
    flex: 1,
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#0089FF",
    letterSpacing: 1,
  },
  copyButton: {
    padding: scale(8),
    borderRadius: scale(6),
    backgroundColor: "#f0f8ff",
  },
  shareButton: {
    flexDirection: "row",
    backgroundColor: "#0089FF",
    borderRadius: scale(12),
    paddingVertical: scale(18),
    paddingHorizontal: scale(30),
    marginHorizontal: scale(20),
    justifyContent: "center",
    alignItems: "center",
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
  shareIcon: {
    marginRight: scale(10),
  },
  shareButtonText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  footerSpace: {
    height: scale(40),
  },
  skeletonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonText: {
    height: scale(20),
    backgroundColor: '#e1e9ee',
    borderRadius: scale(4),
    width: '70%',
  },
  loadingText: {
    marginLeft: scale(10),
    fontSize: scale(14),
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: scale(8),
    fontSize: scale(14),
    color: '#f44336',
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(12),
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    backgroundColor: '#f0f8ff',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#0089FF',
  },
  retryText: {
    marginLeft: scale(6),
    fontSize: scale(14),
    color: '#0089FF',
    fontWeight: '600',
  },
  copyButtonSuccess: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(10),
    paddingVertical: scale(8),
  },
  successText: {
    marginLeft: scale(5),
    fontSize: scale(14),
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default InviteScreen;
