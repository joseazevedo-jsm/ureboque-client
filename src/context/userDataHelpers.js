import { ACTIVE_SERVICE_STATUSES } from '../utils/serviceState';

export const SERVICES_PAGE_LIMIT = 20;

const ACTIVE_SERVICE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

// Keys are the exact strings thrown by ureboque-api's PromotionService. Any key
// missing here leaks raw English server text into a Portuguese UI.
const PROMOTION_ERROR_MESSAGES = {
  'User who generated the code cannot use it': 'O utilizador que gerou o código não pode utilizá-lo',
  'Promotion code not found': 'Código promocional não encontrado',
  'Promotion not found': 'Código promocional não encontrado',
  'Promotion not found for the user': 'Não tem este código promocional activo',
  'Promotion code expired': 'Código promocional expirado',
  'Promotion code has expired': 'Código promocional expirado',
  'Promotion code already used': 'Código promocional já utilizado',
  'Promotion already activated by the user': 'Já activou este código promocional',
  'Promotion code is not available': 'Código promocional indisponível',
  'Promotion code is not yet active': 'Código promocional ainda não está activo',
  'Promotion code limit exceeded': 'Limite de utilizações do código atingido',
  'User already has a promotion code': 'Já tem um código promocional activo',
  'User not found': 'Utilizador não encontrado',
  'Invalid promotion code': 'Código promocional inválido',
};

// A non-terminal service older than the recovery window is abandoned, not
// current. Shared with trip recovery so both paths agree on what "active" means.
export const isStaleActiveService = (service, now = Date.now()) => {
  const createdAt = service?.createdAt ? new Date(service.createdAt).getTime() : 0;
  if (!createdAt) return false;
  return now - createdAt > ACTIVE_SERVICE_MAX_AGE_MS;
};

export const isRecoverableActiveService = (item, now = Date.now()) => {
  const service = item?.service;
  if (!ACTIVE_SERVICE_STATUSES.includes(service?.status) || !service?.driver || service?.review?.rating) {
    return false;
  }

  const createdAt = service?.createdAt ? new Date(service.createdAt).getTime() : 0;
  return createdAt > 0 && now - createdAt <= ACTIVE_SERVICE_MAX_AGE_MS;
};

export const normalizeNotification = (notification) => ({
  ...notification,
  read: notification?.read ?? notification?.isRead ?? false,
});

export const getPromotionErrorMessage = (serverError) => {
  if (!serverError) return 'Falha ao activar código promocional';
  // Never surface raw server text: it is English and developer-facing.
  return PROMOTION_ERROR_MESSAGES[serverError] || 'Não foi possível activar o código promocional';
};
