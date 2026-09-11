import { validators } from './validation';

// Login form validation schema
// Messages here are surfaced directly on the login screen, so they are in the
// app's language (pt).
export const loginValidationSchema = {
  phoneNumber: [
    {
      validator: validators.required,
      message: 'Introduza o seu número de telefone'
    },
    {
      validator: validators.phone,
      message: 'Número de telefone inválido. Use apenas dígitos.'
    },
    {
      validator: (value) => validators.minLength(value, 9),
      message: 'O número de telefone deve ter pelo menos 9 caracteres'
    },
    {
      validator: (value) => validators.maxLength(value, 15),
      message: 'O número de telefone tem no máximo 15 dígitos'
    }
  ]
};

// OTP validation schema  
export const otpValidationSchema = {
  otpCode: [
    {
      validator: validators.required,
      message: 'OTP code is required'
    },
    {
      validator: (value) => validators.minLength(value, 4),
      message: 'OTP code must be 4 digits'
    },
    {
      validator: (value) => validators.maxLength(value, 4),
      message: 'OTP code must be 4 digits'
    },
    {
      validator: validators.numeric,
      message: 'OTP code must contain only numbers'
    }
  ]
};

// User registration validation schema
export const userRegistrationSchema = {
  name: [
    {
      validator: validators.required,
      message: 'Name is required'
    },
    {
      validator: (value) => validators.minLength(value, 2),
      message: 'Name must be at least 2 characters'
    }
  ],
  email: [
    {
      validator: validators.email,
      message: 'Please enter a valid email address'
    }
  ],
  phoneNumber: [
    {
      validator: validators.required,
      message: 'Phone number is required'
    },
    {
      validator: validators.phone,
      message: 'Please enter a valid phone number'
    }
  ]
};

// Saved places validation schema
export const savedPlaceSchema = {
  name: [
    {
      validator: validators.required,
      message: 'Place name is required'
    },
    {
      validator: (value) => validators.minLength(value, 2),
      message: 'Place name must be at least 2 characters'
    }
  ],
  address: [
    {
      validator: validators.required,
      message: 'Address is required'
    }
  ]
};