import { validators } from './validation';

// Login form validation schema
export const loginValidationSchema = {
  phoneNumber: [
    {
      validator: validators.required,
      message: 'Phone number is required'
    },
    {
      validator: validators.phone,
      message: 'Please enter a valid phone number'
    },
    {
      validator: (value) => validators.minLength(value, 9),
      message: 'Phone number must be at least 9 digits'
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