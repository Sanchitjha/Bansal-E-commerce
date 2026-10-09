import crypto from 'crypto';
import mongoose, { Schema, type Model } from 'mongoose';
import { connectDB } from './db';

export const newId = () => crypto.randomBytes(12).toString('hex');

// API responses keep the same shape the frontend always had: `id` instead of `_id`, no `__v`.
const jsonOptions = {
  versionKey: false,
  transform: (_doc: unknown, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
};

// Mongoose's generic option types reject string _id schemas here, so this one helper is loosely typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const options = (extra: Record<string, unknown> = {}): any => ({ versionKey: false, toJSON: jsonOptions, ...extra });
const idField = { _id: { type: String, default: newId } };

export interface IBulkSlab {
  minQty: number;
  pricePerUnit: number;
}

export interface IProduct {
  _id: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  brand: string;
  shortDescription: string;
  longDescription: string;
  images: string[];
  videos: string[];
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  discountPercent: number;
  gstRate: number;
  hsnCode: string;
  stock: number;
  lowStockThreshold: number;
  weightKg: number;
  dimensionsCm?: string;
  status: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isHomepagePriority: boolean;
  priorityOrder: number;
  isBulkAvailable: boolean;
  bulkSlabs: IBulkSlab[];
  variants: unknown[];
  rating: number;
  reviewsCount: number;
  seoTitle?: string;
  metaDescription?: string;
  urlSlug: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    ...idField,
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: '' },
    brand: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    longDescription: { type: String, default: '' },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    costPrice: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    gstRate: { type: Number, default: 18 },
    hsnCode: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    weightKg: { type: Number, default: 0 },
    dimensionsCm: String,
    status: { type: String, default: 'active', index: true },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isHomepagePriority: { type: Boolean, default: false },
    priorityOrder: { type: Number, default: 0 },
    isBulkAvailable: { type: Boolean, default: false },
    bulkSlabs: { type: [new Schema({ minQty: Number, pricePerUnit: Number }, { _id: false })], default: [] },
    variants: { type: [Schema.Types.Mixed], default: [] },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    seoTitle: String,
    metaDescription: String,
    urlSlug: { type: String, required: true, unique: true },
    keywords: { type: [String], default: [] },
  },
  options({ timestamps: true })
);

export interface IAdmin {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
}
const adminSchema = new Schema<IAdmin>(
  {
    ...idField,
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: 'Admin' },
  },
  options({ timestamps: { createdAt: true, updatedAt: false } })
);

export interface ICustomer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
}
const customerSchema = new Schema<ICustomer>(
  {
    ...idField,
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
  },
  options({ timestamps: { createdAt: true, updatedAt: false } })
);

export interface IReview {
  _id: string;
  productId: string;
  author: string;
  location: string;
  rating: number;
  title: string;
  content: string;
  date: Date;
  verified: boolean;
}
const reviewSchema = new Schema<IReview>(
  {
    ...idField,
    productId: { type: String, required: true, index: true },
    author: { type: String, required: true },
    location: { type: String, default: '' },
    rating: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    verified: { type: Boolean, default: true },
  },
  options()
);

export interface ICartItem {
  productId: string;
  quantity: number;
  selectedVariantId: string;
  addedAt: Date;
}
export interface ICartSession {
  _id: string;
  activeCouponCode?: string | null;
  items: ICartItem[];
  wishlist: string[];
  updatedAt: Date;
}
const cartSessionSchema = new Schema<ICartSession>(
  {
    ...idField,
    activeCouponCode: { type: String, default: null },
    items: {
      type: [
        new Schema(
          {
            productId: { type: String, required: true },
            quantity: { type: Number, required: true },
            // '' means "no variant selected"
            selectedVariantId: { type: String, default: '' },
            addedAt: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    wishlist: { type: [String], default: [] },
  },
  options({ timestamps: { createdAt: false, updatedAt: true } })
);

export interface ICoupon {
  _id: string;
  code: string;
  type: string;
  value: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  firstOrderOnly: boolean;
  categorySpecific?: string | null;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
}
const couponSchema = new Schema<ICoupon>(
  {
    ...idField,
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, required: true },
    value: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    firstOrderOnly: { type: Boolean, default: false },
    categorySpecific: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
  },
  options({ timestamps: { createdAt: true, updatedAt: false } })
);

export interface IOrder {
  _id: string;
  date: Date;
  customerName: string;
  phone: string;
  email: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  items: unknown[];
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  taxableAmount: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  courier?: string | null;
  trackingNumber?: string | null;
  accessToken?: string | null;
  gatewayOrderId?: string | null;
  paymentRef?: string | null;
  customerId?: string | null;
}
const orderSchema = new Schema<IOrder>(
  {
    ...idField,
    date: { type: Date, default: Date.now, index: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    shippingAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    items: { type: [Schema.Types.Mixed], default: [] },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    taxableAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    orderStatus: { type: String, required: true },
    courier: { type: String, default: null },
    trackingNumber: { type: String, default: null },
    // Unguessable token that grants access to this order's invoice link.
    accessToken: { type: String, default: null },
    // Razorpay order id (created at checkout) and payment id (set once paid).
    gatewayOrderId: { type: String, default: null, index: true },
    paymentRef: { type: String, default: null },
    customerId: { type: String, default: null, index: true },
  },
  options()
);

export interface IBulkEnquiry {
  _id: string;
  name: string;
  company: string;
  mobile: string;
  email: string;
  productName: string;
  quantity: number;
  expectedDate: string;
  message: string;
  status: string;
  createdAt: Date;
}
const bulkEnquirySchema = new Schema<IBulkEnquiry>(
  {
    ...idField,
    name: { type: String, required: true },
    company: { type: String, default: '' },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    expectedDate: { type: String, default: '' },
    message: { type: String, default: '' },
    status: { type: String, default: 'New' },
  },
  options({ timestamps: { createdAt: true, updatedAt: false } })
);

export interface IHeroBanner {
  _id: string;
  title: string;
  subtitle: string;
  badge: string;
  discountTag: string;
  buttonText: string;
  destinationUrl: string;
  imageUrl: string;
  priority: number;
  isActive: boolean;
  productId?: string | null;
}
const heroBannerSchema = new Schema<IHeroBanner>(
  {
    ...idField,
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    badge: { type: String, default: '' },
    discountTag: { type: String, default: '' },
    buttonText: { type: String, default: 'ORDER NOW' },
    destinationUrl: { type: String, default: '/' },
    imageUrl: { type: String, required: true },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    productId: { type: String, default: null },
  },
  options()
);

export interface IActivityLog {
  _id: string;
  adminName: string;
  action: string;
  timestamp: Date;
  details?: string;
}
const activityLogSchema = new Schema<IActivityLog>(
  {
    ...idField,
    adminName: { type: String, required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    details: String,
  },
  options()
);

export interface ISheetSyncLog {
  _id: string;
  sheetName: string;
  orderId?: string;
  event: string;
  timestamp: Date;
  status: string;
}
const sheetSyncLogSchema = new Schema<ISheetSyncLog>(
  {
    ...idField,
    sheetName: { type: String, required: true },
    orderId: String,
    event: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    status: { type: String, default: 'Synced' },
  },
  options()
);

export interface ISiteSettings {
  _id: string;
  websiteName: string;
  logoText: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  whatsAppNumber: string;
  freeShippingThreshold: number;
  defaultShippingCharge: number;
  lowStockAlertThreshold: number;
  sellerState: string;
  gstin: string;
  legalName: string;
  codEnabled: boolean;
  blockedPincodes: string;
}
const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    _id: { type: String, default: 'singleton' },
    websiteName: { type: String, default: 'Luminary' },
    logoText: { type: String, default: 'Luminary' },
    contactPhone: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    address: { type: String, default: '' },
    whatsAppNumber: { type: String, default: '' },
    freeShippingThreshold: { type: Number, default: 999 },
    defaultShippingCharge: { type: Number, default: 99 },
    lowStockAlertThreshold: { type: Number, default: 10 },
    sellerState: { type: String, default: 'Punjab' },
    gstin: { type: String, default: '' },
    legalName: { type: String, default: '' },
    codEnabled: { type: Boolean, default: true },
    blockedPincodes: { type: String, default: '' },
  },
  options()
);

export interface ILoginAttempt {
  _id: string;
  failures: number;
  windowStart: Date;
  lockedUntil?: Date | null;
}
// Failed-login counters live in the database because serverless instances share no memory.
const loginAttemptSchema = new Schema<ILoginAttempt>(
  {
    _id: { type: String },
    failures: { type: Number, default: 0 },
    windowStart: { type: Date, default: Date.now },
    lockedUntil: { type: Date, default: null },
  },
  options()
);

export interface IOtpCode {
  _id: string; // "<purpose>:<email>", so each email has at most one live code per purpose
  email: string;
  purpose: 'login' | 'reset';
  codeHash: string;
  attempts: number;
  sentAt: Date;
  expiresAt: Date;
}
// One-time email codes. Only a keyed hash is stored, never the code itself; old rows are removed automatically.
const otpCodeSchema = new Schema<IOtpCode>(
  {
    _id: { type: String },
    email: { type: String, required: true },
    purpose: { type: String, required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  options()
);
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

function register<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

const models = {
  Admin: register('Admin', adminSchema),
  Customer: register('Customer', customerSchema),
  Product: register('Product', productSchema),
  Review: register('Review', reviewSchema),
  CartSession: register('CartSession', cartSessionSchema),
  Coupon: register('Coupon', couponSchema),
  Order: register('Order', orderSchema),
  BulkEnquiry: register('BulkEnquiry', bulkEnquirySchema),
  HeroBanner: register('HeroBanner', heroBannerSchema),
  ActivityLog: register('ActivityLog', activityLogSchema),
  SheetSyncLog: register('SheetSyncLog', sheetSyncLogSchema),
  SiteSettings: register('SiteSettings', siteSettingsSchema),
  LoginAttempt: register('LoginAttempt', loginAttemptSchema),
  OtpCode: register('OtpCode', otpCodeSchema),
};

/** Connects (once per process) and hands back the models. Always call this instead of importing models directly. */
export async function db() {
  await connectDB();
  return models;
}

/** Plain JSON copy of a document or query result, with ids as `id` (what the frontend expects). */
export function plain<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
