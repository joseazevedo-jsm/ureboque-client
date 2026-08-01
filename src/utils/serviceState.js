export const ACTIVE_SERVICE_STATUSES = ['connecting', 'assigned', 'in-progress'];
export const TERMINAL_SERVICE_STATUSES = ['completed', 'cancelled'];

export const isActiveServiceStatus = (status) => ACTIVE_SERVICE_STATUSES.includes(status);

export const getTripStatusFromDriverLeg = (driverLegStatus) => {
  switch (driverLegStatus) {
    case 1:
      return 'assigned';
    case 2:
      return 'in-progress';
    default:
      return null;
  }
};

export const getRecoverySheetForTripStatus = (status) => {
  switch (status) {
    case 'connecting':
      return 'rideSearch';
    case 'assigned':
      return 'tripStarted';
    case 'in-progress':
      return 'tripEnding';
    default:
      return null;
  }
};
