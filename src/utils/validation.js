export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  phone: (phone) => {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 9;
  },

  required: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  minLength: (value, min) => {
    return value && value.toString().length >= min;
  },

  maxLength: (value, max) => {
    return value && value.toString().length <= max;
  },

  numeric: (value) => {
    return !isNaN(value) && !isNaN(parseFloat(value));
  },

  positive: (value) => {
    return parseFloat(value) > 0;
  },

  url: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  for (const field in rules) {
    const value = data[field];
    const fieldRules = rules[field];
    
    for (const rule of fieldRules) {
      if (typeof rule === 'function') {
        if (!rule(value)) {
          errors[field] = `Invalid ${field}`;
          break;
        }
      } else if (typeof rule === 'object') {
        const { validator, message } = rule;
        if (!validator(value)) {
          errors[field] = message;
          break;
        }
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};