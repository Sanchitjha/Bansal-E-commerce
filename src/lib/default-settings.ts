import type { SiteSettings } from '@/types';

/** Placeholder values used until real settings load, and as a fallback if the database has none. */
export const DEFAULT_SETTINGS: SiteSettings = {
  websiteName: 'Luminary',
  logoText: 'Luminary',
  contactPhone: '',
  contactEmail: '',
  address: '',
  whatsAppNumber: '',
  freeShippingThreshold: 99999,
  defaultShippingCharge: 98,
  lowStockAlertThreshold: 10,
  sellerState: 'Punjab',
  gstin: '',
  legalName: '',
  codEnabled: true,
  blockedPincodes: '',
};
