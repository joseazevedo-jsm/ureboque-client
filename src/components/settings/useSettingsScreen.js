import { useState } from "react";
import { useUserData } from "../../context/UserDataContext";
import { useAuth } from "../../context/AuthContext";
import { useLogger } from "../../hooks/useLogger";
import { useAlert } from "../../context/AlertContext";
import api from "../../services/APIService";

const useSettingsScreen = () => {
  const logger = useLogger('useSettingsScreen');
  const { user } = useUserData();
  const { logout } = useAuth();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = () => {
    logger.debug('Password reset via email requested');

    showAlert({
      type: 'confirmation',
      title: 'Alterar Senha',
      message: `Será enviado um email para ${user?.email || 'o seu endereço de email'} com instruções para alterar a sua senha.`,
      buttons: [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Enviar Email',
          onPress: () => requestPasswordReset()
        }
      ]
    });
  };

  const requestPasswordReset = async () => {
    if (!user?.email) {
      showAlert({ type: 'error', title: 'Erro', message: 'Email do utilizador não encontrado', buttons: [{ text: 'OK' }] });
      return;
    }

    setIsLoading(true);

    try {
      logger.debug('Requesting password reset email', { email: user.email });

      const resp = await api.post('users/request-password-reset', {
        email: user.email
      });

      logger.info(resp.data.message);
      showAlert({
        type: 'success',
        title: 'Email Enviado',
        message: 'Verifique a sua caixa de email para instruções sobre como alterar a sua senha.',
        buttons: [{ text: 'OK' }]
      });

    } catch (error) {
      logger.error('Password reset request failed', {
        error: error.message,
        email: user.email,
        status: error.response?.status,
        responseData: error.response?.data
      });

      showAlert({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao enviar email de recuperação',
        buttons: [{ text: 'OK' }]
      });
    } finally {
      setIsLoading(false);
    }
  };

   

  const handleLogout = () => {
    logger.debug('Logout requested');

    showAlert({
      type: 'confirmation',
      title: "Terminar Sessão",
      message: "Tem certeza que deseja sair da sua conta?",
      buttons: [
        {
          text: "Cancelar",
          style: "cancel",
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
              showAlert({
                type: 'error',
                title: "Erro",
                message: "Erro ao terminar sessão. Tente novamente.",
              });
            }
          },
        },
      ],
    });
  };

  const handleDeleteAccount = () => {
    logger.debug('Delete account requested');

    showAlert({
      type: 'warning',
      title: "Eliminar Conta",
      message: "Esta ação é irreversível. Tem certeza que deseja eliminar permanentemente a sua conta?",
      buttons: [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            // Second confirmation via native prompt (requires text input)
            Alert.prompt(
              "Confirmar Eliminação",
              "Digite 'ELIMINAR' para confirmar:",
              [
                {
                  text: "Cancelar",
                  style: "cancel",
                },
                {
                  text: "Eliminar",
                  style: "destructive",
                  onPress: (text) => {
                    if (text === "ELIMINAR") {
                      deleteAccount();
                    } else {
                      showAlert({
                        type: 'error',
                        title: "Erro",
                        message: "Confirmação incorreta",
                      });
                    }
                  },
                },
              ]
            );
          },
        },
      ],
    });
  };

  const deleteAccount = async () => {
    setIsLoading(true);

    try {
      logger.debug('Attempting to delete account');

      const response = await api.delete(`/users/${user._id}`);

      if (response.data.success) {
        logger.info('Account deleted successfully');
        showAlert({
          type: 'success',
          title: 'Conta Eliminada',
          message: 'A sua conta foi eliminada com sucesso.',
          buttons: [{
            text: 'OK',
            onPress: async () => {
              await logout();
            }
          }]
        });
      } else {
        throw new Error(response.data.message || 'Erro ao eliminar conta');
      }
    } catch (error) {
      logger.error('Account deletion failed', {
        error: error.message,
        userId: user._id
      });

      const errorMessage = error.response?.data?.message || error.message || 'Erro ao eliminar conta';

      showAlert({
        type: 'error',
        title: 'Erro',
        message: errorMessage,
        buttons: [{ text: 'OK' }]
      });
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