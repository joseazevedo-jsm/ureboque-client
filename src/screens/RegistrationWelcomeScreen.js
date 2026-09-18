import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { AppText as Text } from '../components/common/AppText';
import { AppPressable as TouchableOpacity } from '../components/common/AppPressable';
import { AppHeader } from '../components/common/AppHeader';

import { useNavigation, useRoute } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const Icon = MaterialIcons;
import { useLogger } from '../hooks/useLogger';
import { shadows, borderRadius, colors, spacing, sizes, layout, typography } from "../theme";

const RegistrationWelcomeScreen = () => {
  const insets = useSafeAreaInsets();
  const logger = useLogger('RegistrationWelcomeScreen', {
    enableLifecycleLogging: true,
    logProps: true
  });
  
  const navigation = useNavigation();
  const route = useRoute();
  const { phone } = route.params || {};

  logger.debug('RegistrationWelcomeScreen initialized', { hasPhone: !!phone });

  const handleGetStarted = () => {
    logger.info('User starting registration process', { hasPhone: !!phone });
    navigation.navigate('PasswordCreation', { phone });
  };

  const handleBack = () => {
    logger.info('User going back from registration welcome');
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
      <AppHeader title="CRIAR CONTA" leftIcon="arrow-back" leftLabel="Voltar" onLeftPress={handleBack} style={styles.header} />

      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Image
            source={require('../../resources/icons/UREB_CARD.png')}
            resizeMode="contain"
            style={[styles.logo, { tintColor: colors.primary }]}
          />
           <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
          <Text style={styles.subtitle}>Vamos criar a sua conta</Text>
        </View>

        <View style={styles.infoSection}>
          {phone && (
            <View style={styles.phoneInfo}>
              <Icon name="phone" size={20} color={colors.primary} />
              <Text style={styles.phoneText}>{phone}</Text>
            </View>
          )}

          <View style={styles.requirementsSection}>
            <Text style={styles.requirementsTitle}>Vamos precisar de:</Text>
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <Icon name="lock" size={18} color={colors.success} />
                <Text style={styles.requirementText}>Uma senha segura</Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon name="person" size={18} color={colors.success} />
                <Text style={styles.requirementText}>O seu nome e email</Text>
              </View>
            </View>
          </View>

          <View style={styles.timeEstimate}>
            <Icon name="schedule" size={18} color={colors.textSecondary} />
            <Text style={styles.timeText}>Isto levará cerca de 2 minutos</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.disclaimerText}>
          Ao continuar, aceito os termos de uso e política de privacidade do Ureboque
        </Text>
        <TouchableOpacity
          onPress={handleGetStarted}
          style={styles.getStartedButton}
          accessibilityLabel="Começar criação de conta"
          accessibilityRole="button"
        >
          <Text style={styles.getStartedButtonText}>Começar</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageScroll: { flexGrow: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    width: "100%",
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
   },
  content: {
    flexShrink: 0,
    width: "100%",
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.jumbo,
  },
  logo: {
    width: scale(80),
    height: scale(80),
    marginBottom: spacing.xl,
  },

  welcomeTitle: {
    fontSize: typography.h1.fontSize, lineHeight: typography.h1.lineHeight,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: spacing.jumbo,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,

},
  phoneText: {
    flexShrink: 1,
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  requirementsSection: {
    marginBottom: spacing.xxxl,
  },
  requirementsTitle: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  requirementsList: {
    paddingHorizontal: spacing.xl,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  requirementText: {
    flexShrink: 1,
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  footer: {
    width: "100%",
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  disclaimerText: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  getStartedButton: {
    minHeight: sizes.control,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,

},
  getStartedButtonText: {
    color: colors.surface,
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default RegistrationWelcomeScreen;
