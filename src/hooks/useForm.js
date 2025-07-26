import { useState } from 'react';
import { validateForm } from '../utils/validation';

export const useForm = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const setFieldTouched = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validate = () => {
    const validation = validateForm(values, validationRules);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const validateField = (field) => {
    if (!validationRules[field]) return true;
    
    const value = values[field];
    const fieldRules = validationRules[field];
    
    for (const rule of fieldRules) {
      if (typeof rule === 'function') {
        if (!rule(value)) {
          setErrors(prev => ({ ...prev, [field]: `Invalid ${field}` }));
          return false;
        }
      } else if (typeof rule === 'object') {
        const { validator, message } = rule;
        if (!validator(value)) {
          setErrors(prev => ({ ...prev, [field]: message }));
          return false;
        }
      }
    }
    
    setErrors(prev => ({ ...prev, [field]: '' }));
    return true;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const handleSubmit = (onSubmit) => {
    return (event) => {
      if (event && event.preventDefault) {
        event.preventDefault();
      }
      
      const isValid = validate();
      if (isValid) {
        onSubmit(values);
      }
    };
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    validateField,
    reset,
    handleSubmit,
    isValid: Object.keys(errors).length === 0,
  };
};