export type CategoryType = 'fragrance' | 'ayurvedic' | 'gadgets';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'AED';

export interface BulkSlab {
  minQty: number;
  pricePerUnit: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
}

export interface ReviewItem {
  id: string;
  productId: string;
  author: string;
  location: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: CategoryType;
  subcategory: string;
  brand: string;
  shortDescription: string;
  longDescription: string;
  images: string[];
  mrp: number;
  sellingPrice: number;
  costPrice: number; // Hidden from customer
  discountPercent: number;
  gstRate: number; // e.g. 18 or 12
  hsnCode: string;
  stock: number;
  lowStockThreshold: number;
  weightKg: number;
  dimensionsCm?: string;
  status: 'active' | 'inactive';
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isHomepagePriority: boolean;
  priorityOrder: number;
  isBulkAvailable: boolean;
  bulkSlabs: BulkSlab[];
  variants?: ProductVariant[];
  rating: number;
  reviewsCount: number;
  seoTitle?: string;
  metaDescription?: string;
  urlSlug: string;
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedVariantId?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  firstOrderOnly?: boolean;
  categorySpecific?: CategoryType;
  isActive: boolean;
  usageCount: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  unitPrice: number;
  totalPrice: number;
  gstAmount: number;
  hsnCode?: string;
  gstRate?: number;
  taxableValue?: number;
}

export type OrderStatus =
  | 'Pending Payment'
  | 'Payment Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded';

export interface Order {
  id: string;
  date: string;
  customerName: string;
  phone: string;
  email: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  taxableAmount: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'Razorpay' | 'Cashfree' | 'UPI' | 'Credit Card' | 'COD';
  paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  orderStatus: OrderStatus;
  courier?: string;
  trackingNumber?: string;
  accessToken?: string | null;
  gatewayOrderId?: string | null;
  paymentRef?: string | null;
  customerId?: string | null;
}

export type BulkEnquiryStatus =
  | 'New'
  | 'Contacted'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Confirmed'
  | 'Rejected'
  | 'Completed';

export interface BulkEnquiry {
  id: string;
  name: string;
  company: string;
  mobile: string;
  email: string;
  productName: string;
  quantity: number;
  expectedDate: string;
  message: string;
  status: BulkEnquiryStatus;
  createdAt: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  discountTag: string;
  buttonText: string;
  destinationUrl: string;
  imageUrl: string;
  priority: number;
  isActive: boolean;
  productId?: string;
}

export interface ActivityLog {
  id: string;
  adminName: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface GoogleSheetSyncLog {
  id: string;
  sheetName: 'SALES REGISTER' | 'PRODUCT SALES' | 'MONTHLY SUMMARY' | 'RETURNS' | 'COUPONS';
  orderId?: string;
  event: string;
  timestamp: string;
  status: 'Synced' | 'Pending';
}

export interface SiteSettings {
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
