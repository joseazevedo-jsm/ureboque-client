import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useLogger } from './useLogger';
import api from '../services/APIService';

export const useRegistrationFlow = (initialPhone = '', initialPassword = '', showAlert = null) => {
  const logger = useLogger('useRegistrationFlow');
  const navigation = useNavigation();

  // Form Data State
  const [formData, setFormData] = useState({
    phone: initialPhone,
    password: initialPassword,
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
  });

  // UI State
  const [uiState, setUiState] = useState({
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    currentStep: 1,
  });

  // Validation State
  const [validationState, setValidationState] = useState({
    passwordErrors: [],
    personalInfoErrors: [],
  });

  // Password validation rules
  const passwordValidationRules = [
    {
      key: "length",
      rule: formData.password.length >= 8,
      message: "Pelo menos 8 caracteres",
    },
    {
      key: "uppercase",
      rule: /[A-Z]/.test(formData.password),
      message: "Pelo menos uma letra maiúscula",
    },
    {
      key: "lowercase",
      rule: /[a-z]/.test(formData.password),
      message: "Pelo menos uma letra minúscula",
    },
    {
      key: "number",
      rule: /\d/.test(formData.password),
      message: "Pelo menos um número",
    },
    {
      key: "specialChar",
      rule: /[@$!%*?&]/.test(formData.password),
      message: "Pelo menos um caractere especial (@$!%*?&)",
    },
    {
      key: "match",
      rule: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
      message: "As senhas devem coincidir",
    },
  ];

  // Personal info validation rules
  const personalInfoValidationRules = [
    { key: "firstName", value: formData.firstName.trim(), message: "Nome é obrigatório" },
    { key: "lastName", value: formData.lastName.trim(), message: "Sobrenome é obrigatório" },
    { key: "email", value: formData.email.trim(), message: "Email é obrigatório" },
    { key: "emailFormat", value: isValidEmail(formData.email), message: "Email deve ter um formato válido" },
  ];

  // Helper function to validate email format
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // Real-time password validation
  useEffect(() => {
    if (formData.password.length > 0 || formData.confirmPassword.length > 0) {
      const errors = passwordValidationRules
        .filter((rule) => !rule.rule)
        .map((rule) => rule.message);
      setValidationState(prev => ({ ...prev, passwordErrors: errors }));
    } else {
      setValidationState(prev => ({ ...prev, passwordErrors: [] }));
    }
  }, [formData.password, formData.confirmPassword]);

  // Real-time personal info validation
  useEffect(() => {
    if (formData.firstName.length > 0 || formData.lastName.length > 0 || formData.email.length > 0) {
      const errors = personalInfoValidationRules
        .filter((rule) => !rule.value)
        .map((rule) => rule.message);
      setValidationState(prev => ({ ...prev, personalInfoErrors: errors }));
    } else {
      setValidationState(prev => ({ ...prev, personalInfoErrors: [] }));
    }
  }, [formData.firstName, formData.lastName, formData.email]);

  // Form field update functions
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateUIState = (field, value) => {
    setUiState(prev => ({ ...prev, [field]: value }));
  };

  // Specialized input handlers
  const handlePasswordChange = (value) => updateField('password', value);
  const handleConfirmPasswordChange = (value) => updateField('confirmPassword', value);
  
  const handleFirstNameChange = (text) => {
    // Only allow letters and spaces
    const cleanText = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    updateField('firstName', cleanText);
  };

  const handleLastNameChange = (text) => {
    // Only allow letters and spaces
    const cleanText = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    updateField('lastName', cleanText);
  };

  const handleEmailChange = (text) => {
    // Remove spaces and convert to lowercase
    const cleanEmail = text.replace(/\s/g, '').toLowerCase();
    updateField('email', cleanEmail);
  };

  // Validation functions
  const isPasswordValid = () => {
    return passwordValidationRules.every(rule => rule.rule);
  };

  const isPersonalInfoValid = () => {
    return personalInfoValidationRules.every(rule => rule.value);
  };

  // Password strength calculation
  const calculatePasswordStrength = () => {
    const validRules = passwordValidationRules.slice(0, -1).filter(rule => rule.rule).length;
    return (validRules / 5) * 100;
  };

  const getPasswordStrengthColor = () => {
    const strength = calculatePasswordStrength();
    if (strength < 40) return '#F44336';
    if (strength < 80) return '#FF9800';
    return '#4CAF50';
  };

  // Email suggestion helper
  const getEmailSuggestion = () => {
    if (formData.email.includes('@')) return '';
    
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const localPart = formData.email.split('@')[0];
    
    if (localPart.length > 2) {
      return `${localPart}@gmail.com`;
    }
    return '';
  };

  // Navigation helpers
  const goToPasswordCreation = (phone) => {
    updateField('phone', phone);
    updateUIState('currentStep', 1);
    navigation.navigate('PasswordCreation', { phone });
  };

  const goToPersonalInfo = () => {
    if (!isPasswordValid()) {
      showAlert?.({
        type: 'error',
        title: 'Senha inválida',
        message: 'Por favor, certifique-se de que a senha atende a todos os requisitos.',
        buttons: [{ text: 'OK' }]
      });
      return false;
    }

    updateUIState('currentStep', 2);
    logger.info('Password validation passed, proceeding to personal info', { hasPhone: !!formData.phone });
    navigation.navigate('PersonalInfo', { 
      phone: formData.phone, 
      password: formData.password 
    });
    return true;
  };

  const goToSuccess = (firstName) => {
    updateUIState('currentStep', 3);
    navigation.navigate('RegistrationSuccess', { 
      firstName, 
      phone: formData.phone 
    });
  };

  // API Integration
  const createUserAccount = async () => {
    if (!isPersonalInfoValid()) {
      showAlert?.({
        type: 'error',
        title: 'Informações incompletas',
        message: 'Por favor, preencha todos os campos corretamente.',
        buttons: [{ text: 'OK' }]
      });
      return false;
    }

    updateUIState('isLoading', true);
    logger.info('Creating user account', { 
      phone: formData.phone, 
      firstName: formData.firstName, 
      lastName: formData.lastName, 
      email: formData.email 
    });

    try {
      const response = await api.post('/users/register', {
        password: formData.password,
        details: {
          name: formData.firstName.trim(),
          surname: formData.lastName.trim(),
        },
        email: formData.email.trim(),
        phone: formData.phone,
      });

      const data = response.data;
      logger.info('Registration successful', { userId: data?.id });

      if (data) {
        goToSuccess(formData.firstName.trim());
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Registration failed', error);
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message || error.response?.data?.error;

      let message = 'Ocorreu um erro ao criar a sua conta. Tente novamente.';
      if (status === 409 || serverMessage?.toLowerCase().includes('already')) {
        message = 'Este número de telefone já está registado. Tente fazer login.';
      } else if (status === 400 && serverMessage) {
        message = serverMessage;
      } else if (!error.response) {
        message = 'Sem conexão com o servidor. Verifique a sua ligação à internet.';
      }

      showAlert?.({
        type: 'error',
        title: 'Erro no cadastro',
        message,
        buttons: [{ text: 'OK' }]
      });
      return false;
    } finally {
      updateUIState('isLoading', false);
    }
  };

  // Complete login after registration
  const completeRegistration = () => {
    logger.info('User starting to use app after registration', { 
      firstName: formData.firstName, 
      phone: formData.phone 
    });
    
    // Navigate to password state to complete login
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Login',
          params: { passwordState: true, phone: formData.phone }
        }
      ]
    });
  };

  // Return hook interface
  return {
    // State
    formData,
    uiState,
    validationState,

    // Validation helpers
    passwordValidationRules,
    personalInfoValidationRules,
    isPasswordValid,
    isPersonalInfoValid,
    calculatePasswordStrength,
    getPasswordStrengthColor,
    getEmailSuggestion,

    // Field handlers
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleFirstNameChange,
    handleLastNameChange,
    handleEmailChange,
    updateField,
    updateUIState,

    // Navigation
    goToPasswordCreation,
    goToPersonalInfo,
    goToSuccess,
    completeRegistration,

    // API
    createUserAccount,

    // Utility
    logger,
  };
};
