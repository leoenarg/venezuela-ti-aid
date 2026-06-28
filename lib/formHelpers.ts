// Cedula must be digits only. We both strip non-digits on input (sanitizeCedula)
// and validate the stored value, so letters, spaces and symbols cannot be submitted.
export const CEDULA_PATTERN = /^\d+$/;

export function sanitizeCedula(value: string): string {
  return value.replace(/\D/g, "");
}

export const cedulaRules = {
  required: "Ingresa la cedula (solo numeros).",
  pattern: { value: CEDULA_PATTERN, message: "La cedula solo admite numeros." },
  minLength: { value: 4, message: "La cedula debe tener al menos 4 digitos." },
  maxLength: { value: 30, message: "La cedula no puede superar 30 digitos." }
};

// Exact age in completed years from an ISO birth date string. Returns null when the
// date is empty, invalid, or in the future.
export function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 && age <= 125 ? age : null;
}
