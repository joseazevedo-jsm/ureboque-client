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

// Google's "locality" for most of the capital is the whole city or the old
// Belas municipality (Kilamba, Camama, Benfica and Mussulo all come back as
// "Belas"), so those two only name a place when nothing closer is known.
const BROAD_LOCALITIES = ['Luanda', 'Belas'];

const unique = (names) => names.filter((name, i) => name && names.indexOf(name) === i);

// The names of the area around the point, closest first: neighbourhood
// (Maculusso, Golfe), district (Ingombota, Benfica), a precise town (Kilamba,
// Cacuaco), commune (Viana Sede), then the city.
const areaNames = (results) => {
  const localities = unique(results.map((result) => componentOf(result, ['locality'])))
    .filter((town) => !PLUS_CODE.test(town));
  return unique([
    firstComponent(results, ['neighborhood']),
    firstComponent(results, ['sublocality_level_1', 'sublocality']),
    ...localities.filter((town) => !BROAD_LOCALITIES.includes(town)),
    firstComponent(results, ['administrative_area_level_3']),
    ...localities,
    firstComponent(results, ['postal_town', 'administrative_area_level_2']),
  ]);
};

// The label for the point under a pin, from all of Google's reverse-geocode
// results: the street and the closest area name ("Rua 27, Villa Verde II"),
// or with no named street the two closest ("Golfe, Kilamba Kiaxi"). Only the
// first result used to be read, and in Angola that is often the Plus Code.
export const formatReverseGeocodeResults = (results) => {
  const list = Array.isArray(results) ? results.filter(Boolean) : [];
  if (!list.length) return null;
  const areas = areaNames(list);

  const withRoute = list.find(namedRouteOf);
  if (withRoute) {
    const route = namedRouteOf(withRoute);
    const number = componentOf(withRoute, ['street_number']);
    const street = number ? `${route} ${number}` : route;
    const area = areas.find((name) => name !== route);
    return area ? `${street}, ${area}` : street;
  }
  if (areas.length) return areas.slice(0, 2).join(', ');

  // Nothing but a Plus Code: Google's own text without it.
  const named = list.find((result) => !isPlusCodeResult(result) && result.formatted_address);
  return cleanPlaceAddress((named || list[0]).formatted_address) || null;
};
