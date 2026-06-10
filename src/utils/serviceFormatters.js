import { colors } from '../theme';

export const getStatusInfo = (status) => {
  switch (status) {
    case 'completed':
      return { text: 'Concluído', color: colors.success, bgColor: colors.successLight, icon: 'check-circle' };
    case 'cancelled':
      return { text: 'Cancelado', color: colors.error, bgColor: colors.errorLight, icon: 'cancel' };
    case 'requested':
      return { text: 'Solicitado', color: colors.warning, bgColor: colors.warningLight, icon: 'schedule' };
    default:
      return { text: status ?? '', color: colors.textSecondary, bgColor: colors.background, icon: 'help' };
  }
};

export const formatServiceDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDate = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (isSameDate(date, today)) return `Hoje às ${timeStr}`;
  if (isSameDate(date, yesterday)) return `Ontem às ${timeStr}`;
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} às ${timeStr}`;
};

export const formatPrice = (payment, fallback = null) => {
  if (!payment || typeof payment !== 'object') return fallback;
  const amount = payment.amount ?? payment.value;
  if (!amount || typeof amount !== 'number') return fallback;
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'AOA' });
};

export const formatCarDetails = (carData) => {
  if (!carData) return 'Veículo não especificado';
  const { brand, model, color, licensePlate } = carData;
  const parts = [brand, model, color, licensePlate].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Veículo não especificado';
};

export const getOriginDestination = (locations) => {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return { origin: 'Localização não definida', destination: 'Destino não definido' };
  }
  if (locations.length === 1) {
    return {
      origin: locations[0]?.address || locations[0]?.name || 'Localização não definida',
      destination: 'Destino não definido',
    };
  }
  return {
    origin: locations[0]?.address || locations[0]?.name || 'Origem não definida',
    destination: locations[locations.length - 1]?.address || locations[locations.length - 1]?.name || 'Destino não definido',
  };
};
