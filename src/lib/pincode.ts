export interface PincodeInfo {
  valid: boolean;
  /** true when the lookup service itself was unreachable and only the format was checked. */
  unverified: boolean;
  city?: string;
  state?: string;
}

/**
 * Checks a pincode against India Post's public directory. If that free service is down we fail open
 * (format check only) so a third-party outage never blocks customers from ordering.
 */
export async function lookupPincode(code: string): Promise<PincodeInfo> {
  if (!/^[1-9]\d{5}$/.test(code)) return { valid: false, unverified: false };

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return { valid: true, unverified: true };
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    if (entry?.Status === 'Success' && Array.isArray(entry.PostOffice) && entry.PostOffice.length > 0) {
      const office = entry.PostOffice[0];
      return { valid: true, unverified: false, city: office.District || office.Block || office.Name, state: office.State };
    }
    if (entry?.Status === 'Error') return { valid: false, unverified: false };
    return { valid: true, unverified: true };
  } catch {
    return { valid: true, unverified: true };
  }
}

export function isPincodeBlocked(code: string, blockedList: string): boolean {
  return blockedList
    .split(/[\s,;]+/)
    .filter(Boolean)
    .includes(code);
}

const METRO_PREFIXES = ['11', '40', '56', '60', '70', '50'];

/** Rough delivery estimate: same state is quickest, metros next, everywhere else slowest. */
export function estimateDelivery(destState: string | undefined, sellerState: string, pincode: string): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  if (destState && norm(destState) === norm(sellerState)) return '2-3 Business Days';
  if (METRO_PREFIXES.some((p) => pincode.startsWith(p))) return '3-5 Business Days';
  return '5-7 Business Days';
}
