import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import AlertModal from '../components/modals/Alert/AlertModal';
import ErrorService from '../services/ErrorService';

const AlertContext = createContext(null);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [{ text: 'OK' }],
  });
  const dismissTimeoutRef = useRef(null);

  const showAlert = useCallback(({ type = 'info', title = '', message = '', buttons } = {}) => {
    setAlertState({
      visible: true,
      type,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  const handleDismiss = useCallback((onPress) => {
    hideAlert();
    if (onPress) {
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = setTimeout(() => {
        dismissTimeoutRef.current = null;
        onPress();
      }, 200);
    }
  }, [hideAlert]);

  useEffect(() => () => {
    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
  }, []);

  // Register static handler on ErrorService so non-React code can trigger alerts
  useEffect(() => {
    ErrorService.setAlertHandler(showAlert);
    return () => ErrorService.setAlertHandler(null);
  }, [showAlert]);

  const value = useMemo(() => ({ showAlert, hideAlert }), [showAlert, hideAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertModal
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onDismiss={handleDismiss}
      />
    </AlertContext.Provider>
  );
};
