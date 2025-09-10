import { useState } from "react";
import { Alert } from "react-native";
import { useUserData } from "../../context/UserDataContext";
import { useAuth } from "../../context/AuthContext";
import { useLogger } from "../../hooks/useLogger";
import api from "../../services/APIService";

const useSettingsScreen = () => {
  const logger = useLogger('useSettingsScreen');
  const { user } = useUserData();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = () => {
    logger.debug('Change password requested');
    
    Alert.prompt(
      "Alterar Senha",
      "Digite a sua senha atual:",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Continuar",
          onPress: (currentPassword) => {
            if (!currentPassword || currentPassword.trim() === "") {
              Alert.alert("Erro", "Por favor, digite a sua senha atual");
              return;
            }
            
            // Prompt for new password
            Alert.prompt(
              "Nova Senha",
              "Digite a sua nova senha:",
              [
                {
                  text: "Cancelar",
                  style: "cancel"
                },
                {
                  text: "Continuar",
                  onPress: (newPassword) => {
                    if (!newPassword || newPassword.trim() === "") {
                      Alert.alert("Erro", "Por favor, digite a nova senha");
                      return;
                    }
                    
                    if (newPassword.length < 6) {
                      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
                      return;
                    }
                    
                    // Confirm new password
                    Alert.prompt(
                      "Confirmar Nova Senha",
                      "Confirme a sua nova senha:",
                      [
                        {
                          text: "Cancelar",
                          style: "cancel"
                        },
                        {
                          text: "Alterar",
                          onPress: (confirmPassword) => {
                            if (newPassword !== confirmPassword) {
                              Alert.alert("Erro", "As senhas não coincidem");
                              return;
                            }
                            
                            changePassword(currentPassword, newPassword);
                          }
                        }
                      ],
                      "secure-text"
                    );
                  }
                }
              ],
              "secure-text"
            );
          }
        }
      ],
      "secure-text"
    );
  };

  const changePassword = async (currentPassword, newPassword) => {
    setIsLoading(true);
    
    try {
      logger.debug('Attempting to change password');
      
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        userId: user._id
      });

      if (response.data.success) {
        logger.info('Password changed successfully');
        Alert.alert(
          "Sucesso",
          "A sua senha foi alterada com sucesso!",
          [{ text: "OK", style: "default" }]
        );
      } else {
        throw new Error(response.data.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      logger.error('Password change failed', { 
        error: error.message,
        userId: user._id 
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao alterar senha';
      
      Alert.alert(
        "Erro",
        errorMessage,
        [{ text: "OK", style: "default" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logger.debug('Logout requested');
    
    Alert.alert(
      "Terminar Sessão",
      "Tem certeza que deseja sair da sua conta?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              logger.info('User logout confirmed');
              await logout();
            } catch (error) {
              logger.error('Logout error', { error: error.message });
              Alert.alert("Erro", "Erro ao terminar sessão. Tente novamente.");
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    logger.debug('Delete account requested');
    
    Alert.alert(
      "Eliminar Conta",
      "Esta ação é irreversível. Tem certeza que deseja eliminar permanentemente a sua conta?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            Alert.prompt(
              "Confirmar Eliminação",
              "Digite 'ELIMINAR' para confirmar:",
              [
                {
                  text: "Cancelar",
                  style: "cancel"
                },
                {
                  text: "Eliminar",
                  style: "destructive",
                  onPress: (text) => {
                    if (text === "ELIMINAR") {
                      deleteAccount();
                    } else {
                      Alert.alert("Erro", "Confirmação incorreta");
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    
    try {
      logger.debug('Attempting to delete account');
      
      const response = await api.delete(`/users/${user._id}`);

      if (response.data.success) {
        logger.info('Account deleted successfully');
        Alert.alert(
          "Conta Eliminada",
          "A sua conta foi eliminada com sucesso.",
          [
            {
              text: "OK",
              onPress: async () => {
                await logout();
              }
            }
          ]
        );
      } else {
        throw new Error(response.data.message || 'Erro ao eliminar conta');
      }
    } catch (error) {
      logger.error('Account deletion failed', { 
        error: error.message,
        userId: user._id 
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao eliminar conta';
      
      Alert.alert(
        "Erro",
        errorMessage,
        [{ text: "OK", style: "default" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const models = {
    user,
    isLoading
  };

  const operations = {
    handleChangePassword,
    handleLogout,
    handleDeleteAccount
  };

  return {
    models,
    operations
  };
};

export default useSettingsScreen;