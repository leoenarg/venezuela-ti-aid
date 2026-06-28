import type { RegisterOptions } from "react-hook-form";

/**
 * Removes every non-digit character so the cedula only ever holds numbers.
 * Used on input change to keep the field numeric while typing.
 */
export function sanitizeCedula(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Calculates a whole-year age from an ISO birth date string (yyyy-mm-dd).
 * Returns "" when the date is empty, invalid, or in the future, so the
 * caller can keep the age field controlled and never store a negative age.
 */
export function calculateAge(birthDate: string): string {
  if (!birthDate) return "";

  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  if (age < 0) return "";
  return String(age);
}

export const fullNamePattern = /^\p{L}[\p{L}\p{M}]*(?:[ '\u2019.-]\p{L}[\p{L}\p{M}]*)+$/u;

export const fullNameRules = {
  required: "El nombre completo es obligatorio.",
  minLength: {
    value: 2,
    message: "Ingresa el nombre completo."
  },
  pattern: {
    value: fullNamePattern,
    message: "Usa solo nombres y apellidos con letras, espacios, tildes, ñ, dieresis, apostrofe, punto o guion."
  }
} satisfies RegisterOptions;

/**
 * react-hook-form validation rules for the cedula field.
 * Numeric only, required, with a humane Spanish message.
 */
export const cedulaRules = {
  required: "La cedula es obligatoria.",
  pattern: {
    value: /^\d+$/,
    message: "La cedula solo puede contener numeros."
  },
  minLength: {
    value: 4,
    message: "La cedula debe tener al menos 4 digitos."
  }
} satisfies RegisterOptions;
