/**
 * Phone number utility functions for handling Angolan phone numbers
 * Handles the format: 244 + phone number (e.g., "244912345678")
 */

const ANGOLA_COUNTRY_CODE = '244';

/**
 * Extracts the country code from a full phone number
 * @param {string} fullPhone - Full phone number (e.g., "244912345678")
 * @returns {string} Country code (e.g., "244")
 */
export const extractCountryCode = (fullPhone) => {
  if (!fullPhone) return ANGOLA_COUNTRY_CODE;
  
  const phoneStr = fullPhone.toString();
  if (phoneStr.startsWith(ANGOLA_COUNTRY_CODE)) {
    return ANGOLA_COUNTRY_CODE;
  }
  
  return ANGOLA_COUNTRY_CODE;
};

/**
 * Extracts the phone number without country code
 * @param {string} fullPhone - Full phone number (e.g., "244912345678")
 * @returns {string} Phone number without country code (e.g., "912345678")
 */
export const extractPhoneNumber = (fullPhone) => {
  if (!fullPhone) return '';
  
  const phoneStr = fullPhone.toString();
  if (phoneStr.startsWith(ANGOLA_COUNTRY_CODE)) {
    return phoneStr.substring(ANGOLA_COUNTRY_CODE.length);
  }
  
  return phoneStr;
};

/**
 * Combines country code and phone number into full format
 * @param {string} countryCode - Country code (e.g., "244")
 * @param {string} phoneNumber - Phone number without country code (e.g., "912345678")
 * @returns {string} Full phone number (e.g., "244912345678")
 */
export const formatFullPhoneNumber = (countryCode, phoneNumber) => {
  if (!phoneNumber) return '';
  
  const cleanCountryCode = countryCode || ANGOLA_COUNTRY_CODE;
  const cleanPhoneNumber = phoneNumber.toString();
  
  return `${cleanCountryCode}${cleanPhoneNumber}`;
};

/**
 * Formats phone number for display with country code prefix
 * @param {string} fullPhone - Full phone number (e.g., "244912345678")
 * @returns {string} Formatted phone number (e.g., "+244 912345678")
 */
export const formatPhoneForDisplay = (fullPhone) => {
  if (!fullPhone) return '';
  
  const countryCode = extractCountryCode(fullPhone);
  const phoneNumber = extractPhoneNumber(fullPhone);
  
  if (!phoneNumber) return '';
  
  return `+${countryCode} ${phoneNumber}`;
};

/**
 * Validates if a phone number is valid (basic validation)
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  
  const cleanPhone = phoneNumber.toString().replace(/\D/g, '');
  
  // Basic validation: should have at least 9 digits (typical Angolan phone number length)
  return cleanPhone.length >= 9;
};

/**
 * Validates if a full phone number (with country code) is valid
 * @param {string} fullPhone - Full phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidFullPhoneNumber = (fullPhone) => {
  if (!fullPhone) return false;
  
  const phoneStr = fullPhone.toString();
  if (!phoneStr.startsWith(ANGOLA_COUNTRY_CODE)) return false;
  
  const phoneNumber = extractPhoneNumber(fullPhone);
  return isValidPhoneNumber(phoneNumber);
};