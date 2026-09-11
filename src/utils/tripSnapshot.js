// One acceptance rule shared by socket delivery and HTTP recovery.
export const acceptsTripSnapshot = (current, service) => Boolean(
  service?._id && Number.isFinite(service.version) && current?.service?._id === service._id &&
  (current._version == null || service.version > current._version)
);

export const reduceTripSnapshot = (current, service) => {
  if (!acceptsTripSnapshot(current, service)) return current;
  const connected = ['connecting', 'assigned', 'in-progress'].includes(service.status);
  return { ...current, service: service.status === 'cancelled' ? null : service,
    status: service.status === 'cancelled' ? null : service.status,
    _version: service.version, driverConnected: connected,
    driver: connected && service.driver ? {
      id: service.driver._id, driverId: service.driver._id,
      name: `${service.driver.details?.name || ''} ${service.driver.details?.surname || ''}`.trim(),
      photo: service.driver.user_photo_url, phone: service.driver.phone,
    } : null,
  };
};
