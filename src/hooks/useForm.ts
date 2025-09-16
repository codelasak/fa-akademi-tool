"use client";

import { useState, useCallback, useEffect } from "react";
import { FormValidator, ValidationSchema, FormErrors, ValidationRule } from "@/lib/validation";

interface useFormProps<T extends Record<string, any>> {
  initialValues: T;
  validationSchema?: ValidationSchema;
  onSubmit: (values: T) => Promise<void> | void;
  onSuccess?: () => void;
  onError?: (errors: FormErrors) => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
  onSuccess,
  onError,
}: useFormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validator = validationSchema ? new FormValidator(validationSchema) : null;

  const setValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);

    // Clear error when user starts typing
    if (errors[name as string]) {
      setErrors(prev => ({ ...prev, [name as string]: "" }));
    }
  }, [errors]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Handle different input types
    let processedValue: any = value;

    if (type === "checkbox") {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      processedValue = value === "" ? "" : Number(value);
    } else if ('multiple' in e.target && e.target.multiple) {
      const select = e.target as HTMLSelectElement;
      processedValue = Array.from(select.selectedOptions).map(option => option.value);
    }

    setValue(name as keyof T, processedValue);
  }, [setValue]);

  const setFieldValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValue(name, value);
  }, [setValue]);

  const setError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name as string]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsDirty(false);
  }, [initialValues]);

  const validate = useCallback(() => {
    if (!validator) return true;

    const newErrors = validator.validate(values);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validator, values]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validate form
    if (validator && !validate()) {
      onError?.(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
      onSuccess?.();
      reset();
    } catch (error) {
      console.error("Form submission error:", error);
      // You can handle specific error types here
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validator, validate, onSubmit, onSuccess, onError, reset, errors]);

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    setValue,
    setFieldValue,
    setError,
    handleChange,
    clearErrors,
    reset,
    validate,
    handleSubmit,
  };
}

// Hook for individual field validation
export function useFieldValidation<T extends Record<string, any>>(
  name: keyof T,
  value: T[keyof T],
  rules?: ValidationRule
) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched && rules) {
      const validator = new FormValidator({ [name as string]: rules });
      const errors = validator.validate({ [name as string]: value });
      setError(errors[name as string] || null);
    }
  }, [value, touched, name, rules]);

  const onBlur = useCallback(() => {
    setTouched(true);
  }, []);

  return {
    error,
    touched,
    onBlur,
  };
}