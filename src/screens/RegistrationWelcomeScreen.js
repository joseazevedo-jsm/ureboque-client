import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLogger } from '../hooks/useLogger';

const RegistrationWelcomeScreen = () => {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Icon name="arrow-back" size={24} color="#0089FF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Image
            source={require('../../resources/icons/UREB_CARD.png')}
            resizeMode="contain"
            style={[styles.logo, { tintColor: '#0089FF' }]}
          />
           <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
          <Text style={styles.subtitle}>Vamos criar a sua conta</Text>
        </View>

        <View style={styles.infoSection}>
          {phone && (
            <View style={styles.phoneInfo}>
              <Icon name="phone" size={20} color="#0089FF" />
              <Text style={styles.phoneText}>{phone}</Text>
            </View>
          )}

          <View style={styles.requirementsSection}>
            <Text style={styles.requirementsTitle}>Vamos precisar de:</Text>
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <Icon name="lock" size={18} color="#4CAF50" />
                <Text style={styles.requirementText}>Uma senha segura</Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon name="person" size={18} color="#4CAF50" />
                <Text style={styles.requirementText}>O seu nome e email</Text>
              </View>
            </View>
          </View>

          <View style={styles.timeEstimate}>
            <Icon name="schedule" size={18} color="#707070" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: scale(20),
  },
  header: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(20),
   },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: scale(40),
  },
  logo: {
    width: scale(80),
    height: scale(80),
    marginBottom: scale(20),
  },

  welcomeTitle: {
    fontSize: scale(28),
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: scale(18),
    color: '#64748B',
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: scale(40),
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(14),
    marginBottom: scale(30),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  phoneText: {
    fontSize: scale(16),
    color: '#1E293B',
    marginLeft: scale(8),
    fontWeight: '500',
  },
  requirementsSection: {
    marginBottom: scale(30),
  },
  requirementsTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: scale(15),
    textAlign: 'center',
  },
  requirementsList: {
    paddingHorizontal: scale(20),
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  requirementText: {
    fontSize: scale(16),
    color: '#1E293B',
    marginLeft: scale(12),
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: scale(14),
    color: '#64748B',
    marginLeft: scale(8),
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
  },
  disclaimerText: {
    fontSize: scale(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: scale(18),
    marginBottom: scale(25),
    paddingHorizontal: scale(10),
  },
  getStartedButton: {
    backgroundColor: '#0089FF',
    borderRadius: scale(16),
    paddingVertical: scale(16),
    alignItems: 'center',
    shadowColor: '#0089FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default RegistrationWelcomeScreen;
