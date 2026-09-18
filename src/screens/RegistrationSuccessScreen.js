import { shadows, colors, borderRadius, spacing, layout, typography, sizes } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, Image } from 'react-native';
import { AppText as Text } from '../components/common/AppText';
import { AppPressable as TouchableOpacity } from '../components/common/AppPressable';

import { useNavigation, useRoute } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const Icon = MaterialIcons;
import { useLogger } from '../hooks/useLogger';

const RegistrationSuccessScreen = () => {
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
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
              <Icon name="check" size={sizes.iconXL} color={colors.surface} />
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
                  <Icon name="local-taxi" size={18} color={colors.success} />
                  <Text style={styles.benefitText}>Solicitar serviços de reboque</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="history" size={18} color={colors.success} />
                  <Text style={styles.benefitText}>Ver o histórico dos seus serviços</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="star" size={18} color={colors.success} />
                  <Text style={styles.benefitText}>Avaliar motoristas</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="place" size={18} color={colors.success} />
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
          <Icon name="verified-user" size={20} color={colors.success} />
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
          <Icon name="arrow-forward" size={20} color={colors.surface} style={styles.startButtonIcon} />
        </TouchableOpacity>

        <Text style={styles.loginHintText}>
          Será redirecionado para fazer login com a sua nova conta
        </Text>
      </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageScroll: { flexGrow: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: spacing.xl,
  },
  content: {
    flexShrink: 0,
    width: "100%",
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: spacing.jumbo,
  },
  successIconContainer: {
    marginBottom: spacing.sm,
  },
  successIcon: {
    width: scale(80),
    height: scale(80),
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,

},
  textContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: typography.hero.fontSize, lineHeight: typography.hero.lineHeight,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: spacing.lg,
  },
  accountCreatedText: {
    fontSize: typography.h3.fontSize, lineHeight: typography.h3.lineHeight,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  welcomeText: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  nameText: {
    fontSize: typography.h2.fontSize, lineHeight: typography.h2.lineHeight,
    fontWeight: 'bold',
    color: colors.primary,
  },
  benefitsSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  benefitsTitle: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  benefitsList: {
    alignItems: 'flex-start',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  benefitText: {
    flexShrink: 1,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  phoneConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  phoneConfirmationText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.success,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  footer: {
    width: "100%",
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
   },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,

marginBottom: spacing.lg,
  },
  startButtonText: {
    color: colors.surface,
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  startButtonIcon: {
    marginLeft: spacing.sm,
  },
  loginHintText: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RegistrationSuccessScreen;
