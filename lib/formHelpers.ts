import type { RegisterOptions } from "react-hook-form";

/**
 * Removes every non-digit character so the cedula only ever holds numbers.
 * Used on input change to keep the field numeric while typing.
 */
export function sanitizeCedula(value: string): string {
  return value.replace(/\D/g, "");
}

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
