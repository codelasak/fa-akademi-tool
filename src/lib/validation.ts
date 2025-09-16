export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface FormErrors {
  [key: string]: string;
}

export class FormValidator {
  private schema: ValidationSchema;

  constructor(schema: ValidationSchema) {
    this.schema = schema;
  }

  validate(values: Record<string, any>): FormErrors {
    const errors: FormErrors = {};

    Object.keys(this.schema).forEach((field) => {
      const value = values[field];
      const rules = this.schema[field];

      // Required validation
      if (rules.required && (value === undefined || value === null || value === "")) {
        errors[field] = rules.message || `${field} alanı zorunludur`;
        return;
      }

      // Skip other validations if field is empty and not required
      if (value === undefined || value === null || value === "") {
        return;
      }

      // Min length validation
      if (rules.minLength && typeof value === "string" && value.length < rules.minLength) {
        errors[field] = rules.message || `${field} en az ${rules.minLength} karakter olmalıdır`;
        return;
      }

      // Max length validation
      if (rules.maxLength && typeof value === "string" && value.length > rules.maxLength) {
        errors[field] = rules.message || `${field} en fazla ${rules.maxLength} karakter olabilir`;
        return;
      }

      // Pattern validation
      if (rules.pattern && typeof value === "string" && !rules.pattern.test(value)) {
        errors[field] = rules.message || `${field} formatı geçersiz`;
        return;
      }

      // Custom validation
      if (rules.custom) {
        const customResult = rules.custom(value);
        if (customResult !== true) {
          errors[field] = typeof customResult === "string" ? customResult : `${field} geçersiz`;
        }
      }
    });

    return errors;
  }

  isValid(values: Record<string, any>): boolean {
    const errors = this.validate(values);
    return Object.keys(errors).length === 0;
  }
}

// Common validation schemas
export const COMMON_VALIDATION_SCHEMAS = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Geçerli bir e-posta adresi girin",
  },

  password: {
    required: true,
    minLength: 6,
    message: "Şifre en az 6 karakter olmalıdır",
  },

  username: {
    required: true,
    minLength: 3,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir",
  },

  phone: {
    pattern: /^(\+90|0)?[0-9]{10}$/,
    message: "Geçerli bir telefon numarası girin",
  },

  tcKimlik: {
    pattern: /^[1-9][0-9]{10}$/,
    message: "Geçerli bir TC kimlik numarası girin",
  },

  price: {
    required: true,
    pattern: /^\d+(\.\d{1,2})?$/,
    message: "Geçerli bir fiyat girin",
  },

  date: {
    required: true,
    custom: (value: string) => !isNaN(Date.parse(value)),
    message: "Geçerli bir tarih girin",
  },
};

// Utility functions
export function createValidationSchema(schema: Record<string, ValidationRule>): ValidationSchema {
  return schema;
}

export function validateField(value: any, rules: ValidationRule): string | null {
  const validator = new FormValidator({ field: rules });
  const errors = validator.validate({ field: value });
  return errors.field || null;
}