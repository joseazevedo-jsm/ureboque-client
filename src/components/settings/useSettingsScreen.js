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
    logger.debug('Password reset via email requested');

    Alert.alert(
      "Alterar Senha",
      `Será enviado um email para ${user?.email || 'o seu endereço de email'} com instruções para alterar a sua senha.`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Enviar Email",
          onPress: () => requestPasswordReset()
        }
      ]
    );
  };

  const requestPasswordReset = async () => {
    if (!user?.email) {
      Alert.alert("Erro", "Email do utilizador não encontrado");
      return;
    }

    setIsLoading(true);

    try {
      logger.debug('Requesting password reset email', { email: user.email });

      const resp = await api.post('users/request-password-reset', {
        email: user.email
      });

      logger.info(resp.data.message);
      Alert.alert(
        "Email Enviado",
        "Verifique a sua caixa de email para instruções sobre como alterar a sua senha.",
        [{ text: "OK", style: "default" }]
      );

    } catch (error) {
      logger.error('Password reset request failed', {
        error: error.message,
        email: user.email,
        status: error.response?.status,
        responseData: error.response?.data
      });

      let errorMessage = 'Erro ao enviar email de recuperação';
    
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
      w
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