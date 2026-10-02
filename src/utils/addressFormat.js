// Addresses as people read them. Google often has no street for a point in
// Angola and answers with a Plus Code ("257R+JXQ, Belas, Angola"); the codes
// mean nothing to a client or a driver, so they are never shown.

const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{0,3}\s*/i;

// "273H+GPG, Belas, Angola" → "Belas, Angola";
// "C. Guadiato, 2, 41005 Sevilla, Spain" → "C. Guadiato, 2, Sevilla, Spain".
export const cleanPlaceAddress = (address) => {
  if (typeof address !== 'string') return '';
  return address.split(',')
    .map((part) => part.trim().replace(PLUS_CODE, '').replace(/^\d{4,6}\s+/, '').trim())
    .filter(Boolean)
    .join(', ');
};

const componentOf = (result, types) => {
  const found = (result?.address_components || [])
    .find((component) => types.some((type) => component.types?.includes(type)));
  return found?.long_name;
};

const firstComponent = (results, types) => {
  for (const result of results) {
    const value = componentOf(result, types);
    if (value && !PLUS_CODE.test(value)) return value;
  }
  return null;
};

// Google's name for a road it has no name for ("Unnamed Road" in Portuguese).
const UNNAMED_ROAD = /^(estrada sem nome|unnamed road)$/i;
const namedRouteOf = (result) => {
  const route = componentOf(result, ['route']);
  return route && !UNNAMED_ROAD.test(route) ? route : null;
};

const isPlusCodeResult = (result) =>
  result?.types?.includes('plus_code') || PLUS_CODE.test(result?.formatted_address || '');

const withPlace = (name, place) => (place && place !== name ? `${name}, ${place}` : name);

// The label for the point under a pin, from all of Google's reverse-geocode
// results (most precise first): a street, else the neighbourhood, else the
// town. Only the first result used to be read, and in Angola that is often
// the Plus Code even when a later one names the street.
export const formatReverseGeocodeResults = (results) => {
  const list = Array.isArray(results) ? results.filter(Boolean) : [];
  if (!list.length) return null;
  const place = firstComponent(list, ['locality', 'postal_town', 'administrative_area_level_2']);

  const withRoute = list.find(namedRouteOf);
  if (withRoute) {
    const route = namedRouteOf(withRoute);
    const number = componentOf(withRoute, ['street_number']);
    return withPlace(number ? `${route} ${number}` : route, place);
  }

  // No named street: the neighbourhood (Villa Verde II), a smaller town than
  // the first one (Kilamba in Belas), else the commune (Benfica).
  const otherTown = list.map((result) => componentOf(result, ['locality']))
    .find((town) => town && town !== place);
  const area = firstComponent(list, ['neighborhood'])
    || firstComponent(list, ['sublocality_level_1', 'sublocality'])
    || otherTown
    || firstComponent(list, ['administrative_area_level_3']);
  if (area) return withPlace(area, place);

  // A named place without a road (a car park, a venue): Google's own text.
  const named = list.find((result) => !isPlusCodeResult(result) && result.formatted_address);
  if (named) return cleanPlaceAddress(named.formatted_address) || place;

  return place || cleanPlaceAddress(list[0].formatted_address) || null;
};
