import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const Icon = MaterialIcons;
import { useLogger } from '../hooks/useLogger';

const RegistrationSuccessScreen = () => {
  const logger = useLogger('RegistrationSuccessScreen', {
    enableLifecycleLogging: true,
    logProps: true
  });
  
  const navigation = useNavigation();
  const route = useRoute();
  const { firstName, phone } = route.params || {};

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  logger.debug('RegistrationSuccessScreen initialized', { hasFirstName: !!firstName, hasPhone: !!phone });

  useEffect(() => {
    // Start success animation sequence
    const animationSequence = Animated.sequence([
      // Success icon scale animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Fade in content with slide up
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
      ]),
    ]);

    animationSequence.start();

    // Log successful completion
    logger.info('Registration success animation started', { hasFirstName: !!firstName });
  }, [scaleAnim, fadeAnim, slideAnim, firstName, logger]);

  const handleStartUsingApp = () => {
    logger.info('User starting to use app after registration', { hasFirstName: !!firstName, hasPhone: !!phone });
    
    // Navigate to password state to complete login
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Login',
          params: { passwordState: true, phone }
        }
      ]
    });
  };

  const formatFirstName = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          {/* Success Icon */}
          <Animated.View
            style={[
              styles.successIconContainer,
              {
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.successIcon}>
              <Icon name="check" size={scale(40)} color="#FFFFFF" />
            </View>
          </Animated.View>

          {/* Animated Content */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.successTitle}>Sucesso!</Text>
            <Text style={styles.accountCreatedText}>
              A sua conta foi criada!
            </Text>
            
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>
                Bem-vindo ao Ureboque,
              </Text>
              <Text style={styles.nameText}>
                {formatFirstName(firstName)}!
              </Text>
            </View>

            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>Agora pode:</Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Icon name="local-taxi" size={18} color="#4CAF50" />
                  <Text style={styles.benefitText}>Solicitar serviços de reboque</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="history" size={18} color="#4CAF50" />
                  <Text style={styles.benefitText}>Ver o histórico dos seus serviços</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="star" size={18} color="#4CAF50" />
                  <Text style={styles.benefitText}>Avaliar motoristas</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="place" size={18} color="#4CAF50" />
                  <Text style={styles.benefitText}>Salvar os seus locais favoritos</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Phone verification confirmation */}
        <Animated.View
          style={[
            styles.phoneConfirmation,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Icon name="verified-user" size={20} color="#4CAF50" />
          <Text style={styles.phoneConfirmationText}>
            Número {phone} verificado
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity
          onPress={handleStartUsingApp}
          style={styles.startButton}
          accessibilityLabel="Começar a usar a aplicação"
          accessibilityRole="button"
        >
          <Text style={styles.startButtonText}>Começar a usar</Text>
          <Icon name="arrow-forward" size={20} color="#FFFFFF" style={styles.startButtonIcon} />
        </TouchableOpacity>

        <Text style={styles.loginHintText}>
          Será redirecionado para fazer login com a sua nova conta
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: scale(20),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: scale(40),
  },
  successIconContainer: {
    marginBottom: scale(10),
  },
  successIcon: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  textContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: scale(32),
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: scale(15),
  },
  accountCreatedText: {
    fontSize: scale(20),
    color: '#1E293B',
    marginBottom: scale(15),
    textAlign: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: scale(10),
  },
  welcomeText: {
    fontSize: scale(18),
    color: '#64748B',
    marginBottom: scale(5),
  },
  nameText: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: '#0089FF',
  },
  benefitsSection: {
    alignItems: 'center',
    marginTop: scale(15),
  },
  benefitsTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: scale(15),
  },
  benefitsList: {
    alignItems: 'flex-start',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(10),
    paddingHorizontal: scale(10),
  },
  benefitText: {
    fontSize: scale(14),
    color: '#1E293B',
    marginLeft: scale(10),
  },
  phoneConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(20),
  },
  phoneConfirmationText: {
    fontSize: scale(14),
    color: '#4CAF50',
    marginLeft: scale(8),
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: scale(20),
   },
  startButton: {
    backgroundColor: '#0089FF',
    borderRadius: scale(16),
    paddingVertical: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0089FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: scale(15),
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  startButtonIcon: {
    marginLeft: scale(8),
  },
  loginHintText: {
    fontSize: scale(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: scale(18),
  },
});

export default RegistrationSuccessScreen;
