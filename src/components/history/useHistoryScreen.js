import { useState, useEffect } from 'react';
import { useUserData } from '../../context/UserDataContext';
import { useAuth } from '../../context/AuthContext';
import { useLogger } from '../../hooks/useLogger';

const useHistoryScreen = () => {
  const logger = useLogger('useHistoryScreen', {
    enableLifecycleLogging: true,
    logProps: true
  });

  const { user, services, servicesLoading, servicesHasMore, servicesLoadedUserId, fetchUserServices, loadMoreServices } = useUserData();
  const { userToken } = useAuth();

  // Get count of services by status
  const getStatusCounts = (services) => {
    return services.reduce((acc, service) => {
      acc[service.status] = (acc[service.status] || 0) + 1;
      return acc;
    }, {});
  };

   const [state, setState] = useState({
    isRefreshing: false,
    error: null,
  });

  // Refresh services from UserDataContext
  const refreshServices = async () => {
    const userId = user?._id || user?.id;
    
    if (!userId || !userToken) {
      setState(prev => ({ ...prev, error: 'Dados do usuário não encontrados' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isRefreshing: true, error: null }));
      
      logger.info('Refreshing service history from context', { userId });
      
      await fetchUserServices(userId, { refreshing: true });
      
      logger.info('Service history refreshed successfully');
      
    } catch (error) {
      logger.error('Failed to refresh service history', {
        error: error.message,
        userId
      });

      const errorMessage = getErrorMessage(error);
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  };

  // Get error message based on error type
  const getErrorMessage = (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 404:
          return 'Nenhum histórico de serviços encontrado';
        case 401:
          return 'Sessão expirada. Faça login novamente';
        case 403:
          return 'Acesso negado aos dados de histórico';
        case 500:
          return 'Erro interno do servidor. Tente novamente';
        default:
          return 'Erro ao carregar histórico de serviços';
      }
    } else if (error.request) {
      return 'Erro de conexão. Verifique sua internet';
    } else {
      return 'Erro inesperado. Tente novamente';
    }
  };



  // Handle refresh action
  const handleRefresh = async () => {
    logger.logUserInteraction('history_refresh_triggered', {
      currentServicesCount: services.length
    });

    await refreshServices();
  };

  // Handle retry after error
  const handleRetry = async () => {
    logger.logUserInteraction('history_retry_triggered', {
      error: state.error
    });
    await refreshServices();
  };

  // Load services on mount if not already loaded
  useEffect(() => {
    logger.debug('useHistoryScreen mounted', {
      hasUser: !!user,
      hasUserId: !!(user?._id || user?.id),
      hasToken: !!userToken,
      servicesCount: services.length,
      servicesLoading,
      servicesLoadedUserId
    });

    const userId = user?._id || user?.id;
    const servicesLoaded = servicesLoadedUserId === userId;
    
    // Empty history is still a loaded state, so only fetch once per user.
    if (userId && userToken && !servicesLoaded && !servicesLoading) {
      setState(prev => (prev.error ? { ...prev, error: null } : prev));
      logger.info('Fetching initial services data');
      fetchUserServices(userId);
    } else if (userId && userToken && servicesLoaded) {
      setState(prev => (prev.error ? { ...prev, error: null } : prev));
    } else if (!userId || !userToken) {
      setState(prev => ({ 
        ...prev, 
        error: 'Dados do usuário não encontrados' 
      }));
    }
  }, [user, userToken, servicesLoading, servicesLoadedUserId]);

  // Get services filtered by status - handle nested structure
  const getServicesByStatus = (status) => {
    return services.filter(serviceItem => {
      const serviceData = serviceItem.service || serviceItem;
      return serviceData.status === status;
    });
  };

  // Get services count by status
  const getServicesCount = (status = null) => {
    if (!status) return services.length;
    return getServicesByStatus(status).length;
  };

  // Check if has services
  const hasServices = () => services.length > 0;

  // Check if has completed services
  const hasCompletedServices = () => getServicesCount('completed') > 0;

  // Get most recent service
  const getMostRecentService = () => {
    return services.length > 0 ? services[0] : null;
  };

  const handleLoadMore = async () => {
    const userId = user?._id || user?.id;
    if (!userId || !userToken) return;
    await loadMoreServices(userId);
  };

  const models = {
    services: services || [],
    isLoading: servicesLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    hasServices: hasServices(),
    hasCompletedServices: hasCompletedServices(),
    mostRecentService: getMostRecentService(),
    statusCounts: getStatusCounts(services || []),
    hasMore: servicesHasMore,
    servicesLoaded: servicesLoadedUserId === (user?._id || user?.id),
  };

  const operations = {
    handleRefresh,
    handleRetry,
    handleLoadMore,
    getServicesByStatus,
    getServicesCount
  };

  return { models, operations };
};

export default useHistoryScreen;
