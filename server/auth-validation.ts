/** Normalize Indian phone inputs without corrupting international numbers. */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return trimmed;
}

/** Supabase email/SMS OTPs are six decimal digits. */
export function isValidOtp(value: string): boolean {
  return /^\d{6}$/.test(value);
}
