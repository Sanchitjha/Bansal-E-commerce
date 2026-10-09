import { NextRequest, NextResponse } from 'next/server';
import { revalidateCatalog } from '@/lib/data';
import { db } from '@/lib/models';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { canonicalState } from '@/lib/india';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { SiteSettings } = await db();
    return NextResponse.json(await SiteSettings.findById('singleton'));
  } catch (err) {
    return serverError(err);
  }
}

const text = (v: unknown, max = 300) => String(v ?? '').trim().slice(0, max);

/** An optional web link: empty is fine, anything else must be a real http(s) address. Returns null when invalid. */
function link(v: unknown): string | null {
  const value = text(v, 300);
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function PUT(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();

    const sellerState = canonicalState(String(body.sellerState ?? ''));
    if (!sellerState) return badRequest('Please choose the state your business is registered in.');

    const gstin = text(body.gstin, 15).toUpperCase();
    if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
      return badRequest('GSTIN looks invalid. It should be 15 characters, e.g. 27ABCDE1234F1Z5.');
    }

    const freeShippingThreshold = Number(body.freeShippingThreshold);
    const defaultShippingCharge = Number(body.defaultShippingCharge);
    const lowStockAlertThreshold = Number(body.lowStockAlertThreshold);
    if (![freeShippingThreshold, defaultShippingCharge, lowStockAlertThreshold].every((n) => Number.isFinite(n) && n >= 0)) {
      return badRequest('Shipping amounts and stock threshold must be numbers of 0 or more.');
    }

    const blockedPincodes = text(body.blockedPincodes, 5000)
      .split(/[\s,;]+/)
      .filter(Boolean);
    if (blockedPincodes.some((p) => !/^[1-9]\d{5}$/.test(p))) {
      return badRequest('Blocked pincodes must be 6-digit numbers separated by commas.');
    }

    const instagramUrl = link(body.instagramUrl);
    const facebookUrl = link(body.facebookUrl);
    const youtubeUrl = link(body.youtubeUrl);
    if (instagramUrl === null || facebookUrl === null || youtubeUrl === null) {
      return badRequest('Social media links must be full web addresses, e.g. https://instagram.com/yourpage');
    }

    const data = {
      websiteName: text(body.websiteName, 80) || 'Luminary',
      logoText: text(body.logoText, 80) || 'Luminary',
      contactPhone: text(body.contactPhone, 30),
      contactEmail: text(body.contactEmail, 254),
      address: text(body.address, 400),
      whatsAppNumber: text(body.whatsAppNumber, 20).replace(/\D/g, ''),
      freeShippingThreshold,
      defaultShippingCharge,
      lowStockAlertThreshold: Math.round(lowStockAlertThreshold),
      sellerState,
      gstin,
      legalName: text(body.legalName, 120),
      codEnabled: !!body.codEnabled,
      blockedPincodes: blockedPincodes.join(','),
      instagramUrl,
      facebookUrl,
      youtubeUrl,
    };

    const { SiteSettings, ActivityLog } = await db();
    const settings = await SiteSettings.findOneAndUpdate({ _id: 'singleton' }, { $set: data }, { upsert: true, new: true, setDefaultsOnInsert: true });

    await ActivityLog.create({ adminName: admin.name, action: 'Updated Website Settings', details: 'Store settings modified' });

    revalidateCatalog();
    return NextResponse.json(settings);
  } catch (err) {
    return serverError(err);
  }
}
