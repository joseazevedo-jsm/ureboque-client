export const ICON_HOME = require('../../resources/icons/icon_home.png');
export const ICON_WORK = require('../../resources/icons/icon_work.png');
export const ICON_OFICINA = require('../../resources/icons/icon_oficina.png');
export const ICON_SAVED = require('../../resources/icons/icon_saved_places.png');
export const ICON_ADD = require('../../resources/icons/icon_add_saved_places.png');

export const getPlaceIcon = (name) => {
  if (!name) return ICON_SAVED;
  if (name.includes('Casa')) return ICON_HOME;
  if (name.includes('Trabalho')) return ICON_WORK;
  if (name.includes('Oficina')) return ICON_OFICINA;
  if (name === 'Adicionar Favorito') return ICON_ADD;
  return ICON_SAVED;
};
