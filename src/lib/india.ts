// Safe to import from both server and client code.

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/** Maps what India Post / a user typed onto our canonical state name, or null if unknown. */
export function canonicalState(input: string): string | null {
  const n = norm(input);
  if (!n) return null;
  const aliases: Record<string, string> = { orissa: 'Odisha', pondicherry: 'Puducherry', uttaranchal: 'Uttarakhand', nctofdelhi: 'Delhi' };
  if (aliases[n]) return aliases[n];
  return INDIAN_STATES.find((s) => norm(s) === n) ?? null;
}

/** Returns the 10-digit mobile number, or null when it isn't a valid Indian mobile. */
export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const last10 = digits.length >= 10 ? digits.slice(-10) : '';
  return /^[6-9]\d{9}$/.test(last10) ? last10 : null;
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input) && input.length <= 254;
}
