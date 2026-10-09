'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Product,
  CartItem,
  Coupon,
  Order,
  BulkEnquiry,
  HeroBanner,
  ActivityLog,
  GoogleSheetSyncLog,
  SiteSettings,
  OrderStatus,
  BulkEnquiryStatus,
  CategoryType,
  ReviewItem,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/default-settings';
import { computeCartTotals, getUnitPriceForProduct as unitPriceFor } from '@/lib/pricing';

interface CartTotals {
  subtotal: number;
  savings: number;
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  taxableAmount: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  shippingFee: number;
  grandTotal: number;
  itemCount: number;
}

interface AdminSession {
  id: string;
  email: string;
  name: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface RazorpayInit {
  keyId: string;
  gatewayOrderId: string;
  amount: number;
  name: string;
  prefill: { name: string; email: string; contact: string };
}

export interface PlaceOrderResult {
  order: Order;
  razorpay?: RazorpayInit;
}

export interface CheckoutDetails {
  customerName: string;
  phone: string;
  email: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: 'Razorpay' | 'COD';
}

export interface InitialStoreData {
  products: Product[];
  heroBanners: HeroBanner[];
  settings: SiteSettings | null;
}

export type ToastType = 'error' | 'success' | 'info';

type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
type CouponInput = Omit<Coupon, 'id' | 'usageCount'> & { id?: string };

interface LuminaryContextType {
  formatPrice: (amountInINR: number) => string;
  products: Product[];
  adminProducts: Product[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  coupons: Coupon[];
  heroBanners: HeroBanner[];
  adminBanners: HeroBanner[];
  bulkEnquiries: BulkEnquiry[];
  activityLogs: ActivityLog[];
  sheetSyncLogs: GoogleSheetSyncLog[];
  settings: SiteSettings;
  reviews: ReviewItem[];
  activeCoupon: Coupon | null;
  activeCategoryFilter: CategoryType | 'all';
  setActiveCategoryFilter: (cat: CategoryType | 'all') => void;
  paymentOptions: { online: boolean; cod: boolean; email: boolean };

  // Feedback
  toast: { id: number; message: string; type: ToastType } | null;
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: () => void;

  // Cart & Wishlist
  addToCart: (product: Product, quantity?: number, selectedVariantId?: string) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  getCartTotals: () => CartTotals;
  getUnitPriceForProduct: (product: Product, quantity: number) => number;

  // Reviews
  addReview: (review: Omit<ReviewItem, 'id' | 'date' | 'verified'>) => Promise<void>;

  // Checkout & Orders
  placeOrder: (details: CheckoutDetails) => Promise<PlaceOrderResult>;
  verifyPayment: (payload: {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => Promise<Order>;
  cancelPayment: (orderId: string, accessToken: string) => Promise<void>;
  submitBulkEnquiry: (data: Omit<BulkEnquiry, 'id' | 'status' | 'createdAt'>) => Promise<void>;

  // Customer account
  customer: CustomerProfile | null;
  customerOrders: Order[];
  customerLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  customerRegister: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  customerLogout: () => Promise<void>;
  requestEmailCode: (email: string, purpose: 'login' | 'reset') => Promise<{ success: boolean; message?: string }>;
  customerLoginWithCode: (email: string, code: string) => Promise<{ success: boolean; message?: string }>;
  customerResetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  refreshCustomer: () => Promise<void>;

  // Admin auth
  adminSession: AdminSession | null;
  adminAuthChecked: boolean;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  adminLogout: () => Promise<void>;
  changeAdminPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  refreshAdminData: () => Promise<void>;

  // Admin Actions
  saveProduct: (product: ProductInput) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateHeroBanners: (banners: HeroBanner[]) => Promise<void>;
  reorderPriorityProducts: (priorityProductIds: string[]) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, courier?: string, trackingNumber?: string) => Promise<void>;
  updateEnquiryStatus: (enquiryId: string, status: BulkEnquiryStatus) => Promise<void>;
  saveCoupon: (coupon: CouponInput) => Promise<void>;
  toggleCouponStatus: (couponId: string) => Promise<void>;
  updateSettings: (newSettings: SiteSettings) => Promise<void>;
  addStockAdjustment: (productId: string, qtyChange: number, reason: string) => Promise<void>;
}

const LuminaryContext = createContext<LuminaryContextType | undefined>(undefined);


async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

interface CartApiPayload {
  items: CartItem[];
  appliedCoupon: Coupon | null;
}

export const LuminaryProvider: React.FC<{ children: React.ReactNode; initialData?: InitialStoreData }> = ({
  children,
  initialData,
}) => {
  const [products, setProducts] = useState<Product[]>(initialData?.products ?? []);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>(initialData?.heroBanners ?? []);
  const [adminBanners, setAdminBanners] = useState<HeroBanner[]>([]);
  const [bulkEnquiries, setBulkEnquiries] = useState<BulkEnquiry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [sheetSyncLogs, setSheetSyncLogs] = useState<GoogleSheetSyncLog[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(initialData?.settings ?? DEFAULT_SETTINGS);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [paymentOptions, setPaymentOptions] = useState({ online: false, cod: true, email: false });
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [adminAuthChecked, setAdminAuthChecked] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<{ id: number; message: string; type: ToastType } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  // The storefront is light-only and INR-only; clear any dark class saved by older versions.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const formatPrice = (amountInINR: number): string => `₹${Math.round(amountInINR).toLocaleString('en-IN')}`;

  const refreshCustomer = useCallback(async () => {
    try {
      const data = await apiRequest<{ customer: CustomerProfile; orders: Order[] }>('/api/customer/me');
      setCustomer(data.customer);
      setCustomerOrders(data.orders);
    } catch {
      setCustomer(null);
      setCustomerOrders([]);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const data = await apiRequest<CartApiPayload>('/api/cart');
      setCart(data.items || []);
      setActiveCoupon(data.appliedCoupon || null);
    } catch {
      /* keep what we have */
    }
  }, []);

  // Initial data load from the backend (server-rendered data is already in state; this refreshes it).
  useEffect(() => {
    apiRequest<Product[]>('/api/products').then(setProducts).catch(() => {});
    apiRequest<HeroBanner[]>('/api/hero-banners').then(setHeroBanners).catch(() => {});
    apiRequest<SiteSettings>('/api/settings').then((s) => s && setSettings(s)).catch(() => {});
    apiRequest<{ online: boolean; cod: boolean; email: boolean }>('/api/payments/config').then(setPaymentOptions).catch(() => {});
    refreshCart();
    apiRequest<{ productIds: string[] }>('/api/wishlist').then((data) => setWishlist(data.productIds || [])).catch(() => {});
    refreshCustomer();
    apiRequest<AdminSession>('/api/auth/me')
      .then(setAdminSession)
      .catch(() => setAdminSession(null))
      .finally(() => setAdminAuthChecked(true));
  }, [refreshCart, refreshCustomer]);

  const getUnitPriceForProduct = (product: Product, quantity: number): number => unitPriceFor(product, quantity);

  const addToCart = async (product: Product, quantity: number = 1, selectedVariantId?: string): Promise<boolean> => {
    try {
      const data = await apiRequest<CartApiPayload>('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity, selectedVariantId }),
      });
      setCart(data.items || []);
      setActiveCoupon(data.appliedCoupon || null);
      return true;
    } catch (err) {
      showToast(errorText(err, 'Could not add this item to your cart.'), 'error');
      return false;
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const data = await apiRequest<CartApiPayload>(`/api/cart/${productId}`, { method: 'DELETE' });
      setCart(data.items || []);
      setActiveCoupon(data.appliedCoupon || null);
    } catch (err) {
      showToast(errorText(err, 'Could not remove this item.'), 'error');
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    try {
      const data = await apiRequest<CartApiPayload>('/api/cart', {
        method: 'PATCH',
        body: JSON.stringify({ productId, quantity }),
      });
      setCart(data.items || []);
      setActiveCoupon(data.appliedCoupon || null);
    } catch (err) {
      showToast(errorText(err, 'Could not update the quantity.'), 'error');
    }
  };

  const clearCart = async () => {
    await apiRequest('/api/cart', { method: 'DELETE' });
    setCart([]);
    setActiveCoupon(null);
  };

  const toggleWishlist = async (productId: string) => {
    try {
      const data = await apiRequest<{ productIds: string[] }>('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      });
      setWishlist(data.productIds || []);
    } catch (err) {
      showToast(errorText(err, 'Could not update your wishlist.'), 'error');
    }
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = await apiRequest<{ success: boolean; message: string; items?: CartItem[]; appliedCoupon?: Coupon | null }>(
        '/api/coupons/apply',
        { method: 'POST', body: JSON.stringify({ code }) }
      );
      if (data.success) {
        setCart(data.items || []);
        setActiveCoupon(data.appliedCoupon || null);
      }
      return { success: data.success, message: data.message };
    } catch (err) {
      return { success: false, message: errorText(err, 'Could not apply this coupon.') };
    }
  };

  const removeCoupon = async () => {
    try {
      const data = await apiRequest<CartApiPayload>('/api/coupons/apply', { method: 'DELETE' });
      setCart(data.items || []);
      setActiveCoupon(data.appliedCoupon || null);
    } catch (err) {
      showToast(errorText(err, 'Could not remove the coupon.'), 'error');
    }
  };

  // Display-only: the server recomputes every figure at checkout, using the same shared formula.
  const getCartTotals = (): CartTotals => {
    const totals = computeCartTotals({
      lines: cart.map((item) => ({
        productId: item.product.id,
        category: item.product.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        mrp: item.product.mrp,
        gstRate: item.product.gstRate,
      })),
      coupon: activeCoupon,
      freeShippingThreshold: settings.freeShippingThreshold,
      defaultShippingCharge: settings.defaultShippingCharge,
    });
    return {
      subtotal: totals.subtotal,
      savings: totals.savings,
      appliedCoupon: activeCoupon,
      couponDiscount: totals.couponDiscount,
      taxableAmount: totals.taxableAmount,
      gstAmount: totals.gstAmount,
      cgst: totals.cgst,
      sgst: totals.sgst,
      shippingFee: totals.shippingFee,
      grandTotal: totals.grandTotal,
      itemCount: totals.itemCount,
    };
  };

  const addReview = async (newReviewData: Omit<ReviewItem, 'id' | 'date' | 'verified'>) => {
    const review = await apiRequest<ReviewItem>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(newReviewData),
    });
    setReviews((prev) => [review, ...prev]);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === newReviewData.productId) {
          const newCount = p.reviewsCount + 1;
          const newRating = Math.round(((p.rating * p.reviewsCount + newReviewData.rating) / newCount) * 10) / 10;
          return { ...p, rating: newRating, reviewsCount: newCount };
        }
        return p;
      })
    );
  };

  const refreshProducts = () => apiRequest<Product[]>('/api/products').then(setProducts).catch(() => {});

  const placeOrder = async (details: CheckoutDetails): Promise<PlaceOrderResult> => {
    const result = await apiRequest<PlaceOrderResult>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(details),
    });
    // The server emptied the cart when it created the order.
    setCart([]);
    setActiveCoupon(null);
    refreshProducts();
    if (customer) refreshCustomer();
    return result;
  };

  const verifyPayment = async (payload: {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<Order> => {
    const data = await apiRequest<{ order: Order }>('/api/payments/verify', { method: 'POST', body: JSON.stringify(payload) });
    if (customer) refreshCustomer();
    return data.order;
  };

  const cancelPayment = async (orderId: string, accessToken: string) => {
    await apiRequest('/api/payments/cancel', { method: 'POST', body: JSON.stringify({ orderId, accessToken }) }).catch(() => {});
    await refreshCart();
    refreshProducts();
  };

  const submitBulkEnquiry = async (data: Omit<BulkEnquiry, 'id' | 'status' | 'createdAt'>) => {
    const enquiry = await apiRequest<BulkEnquiry>('/api/bulk-enquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setBulkEnquiries((prev) => [enquiry, ...prev]);
  };

  const customerLogin = async (email: string, password: string) => {
    try {
      await apiRequest('/api/customer/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await refreshCustomer();
      return { success: true };
    } catch (err) {
      return { success: false, message: errorText(err, 'Login failed') };
    }
  };

  const customerRegister = async (data: { name: string; email: string; phone: string; password: string }) => {
    try {
      await apiRequest('/api/customer/register', { method: 'POST', body: JSON.stringify(data) });
      await refreshCustomer();
      return { success: true };
    } catch (err) {
      return { success: false, message: errorText(err, 'Could not create your account') };
    }
  };

  const requestEmailCode = async (email: string, purpose: 'login' | 'reset') => {
    try {
      const res = await apiRequest<{ message?: string }>('/api/customer/otp/request', { method: 'POST', body: JSON.stringify({ email, purpose }) });
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, message: errorText(err, 'Could not send the code') };
    }
  };

  const customerLoginWithCode = async (email: string, code: string) => {
    try {
      await apiRequest('/api/customer/otp/verify', { method: 'POST', body: JSON.stringify({ email, code }) });
      await refreshCustomer();
      return { success: true };
    } catch (err) {
      return { success: false, message: errorText(err, 'Could not sign you in') };
    }
  };

  const customerResetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      await apiRequest('/api/customer/password-reset', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) });
      await refreshCustomer();
      return { success: true };
    } catch (err) {
      return { success: false, message: errorText(err, 'Could not reset your password') };
    }
  };

  const customerLogout = async () => {
    await apiRequest('/api/customer/logout', { method: 'POST' }).catch(() => {});
    setCustomer(null);
    setCustomerOrders([]);
  };

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const session = await apiRequest<AdminSession>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAdminSession(session);
      return { success: true };
    } catch (err) {
      return { success: false, message: errorText(err, 'Login failed') };
    }
  };

  const adminLogout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    setAdminSession(null);
    setOrders([]);
    setBulkEnquiries([]);
    setActivityLogs([]);
    setSheetSyncLogs([]);
    setCoupons([]);
    setAdminProducts([]);
    setAdminBanners([]);
  };

  const changeAdminPassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiRequest('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      return { success: true };
    } catch (err) {
      return { success: false, message: errorText(err, 'Could not change the password') };
    }
  };

  const refreshAdminData = useCallback(async () => {
    const [ordersData, enquiriesData, activityData, sheetData, couponsData, productsData, bannersData] = await Promise.all([
      apiRequest<Order[]>('/api/orders').catch(() => []),
      apiRequest<BulkEnquiry[]>('/api/bulk-enquiries').catch(() => []),
      apiRequest<ActivityLog[]>('/api/activity-logs').catch(() => []),
      apiRequest<GoogleSheetSyncLog[]>('/api/sheet-sync-logs').catch(() => []),
      apiRequest<Coupon[]>('/api/coupons').catch(() => []),
      apiRequest<Product[]>('/api/products?includeInactive=true').catch(() => []),
      apiRequest<HeroBanner[]>('/api/hero-banners').catch(() => []),
    ]);
    setOrders(ordersData);
    setBulkEnquiries(enquiriesData);
    setActivityLogs(activityData);
    setSheetSyncLogs(sheetData);
    setCoupons(couponsData);
    setAdminProducts(productsData);
    setAdminBanners(bannersData);
  }, []);

  const upsertById = <T extends { id: string }>(list: T[], item: T) =>
    list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];

  const saveProduct = async (product: ProductInput) => {
    const { id, ...rest } = product;
    const saved = id
      ? await apiRequest<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(rest) })
      : await apiRequest<Product>('/api/products', { method: 'POST', body: JSON.stringify(rest) });
    setAdminProducts((prev) => upsertById(prev, saved));
    setProducts((prev) => (saved.status === 'active' ? upsertById(prev, saved) : prev.filter((p) => p.id !== saved.id)));
  };

  const deleteProduct = async (productId: string) => {
    await apiRequest(`/api/products/${productId}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setAdminProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const updateHeroBanners = async (banners: HeroBanner[]) => {
    const saved = await apiRequest<HeroBanner[]>('/api/hero-banners', { method: 'PUT', body: JSON.stringify(banners) });
    setAdminBanners(saved);
    setHeroBanners(saved.filter((b) => b.isActive));
  };

  const reorderPriorityProducts = async (priorityProductIds: string[]) => {
    await Promise.all(
      adminProducts.map((prod) => {
        const index = priorityProductIds.indexOf(prod.id);
        const isHomepagePriority = index > -1;
        const priorityOrder = isHomepagePriority ? index + 1 : prod.priorityOrder;
        if (isHomepagePriority === prod.isHomepagePriority && priorityOrder === prod.priorityOrder) return null;
        return apiRequest(`/api/products/${prod.id}`, {
          method: 'PUT',
          body: JSON.stringify({ isHomepagePriority, priorityOrder }),
        });
      })
    );
    const [refreshed, adminRefreshed] = await Promise.all([
      apiRequest<Product[]>('/api/products'),
      apiRequest<Product[]>('/api/products?includeInactive=true'),
    ]);
    setProducts(refreshed);
    setAdminProducts(adminRefreshed);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, courier?: string, trackingNumber?: string) => {
    const updated = await apiRequest<Order>(`/api/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ orderStatus: status, courier, trackingNumber }),
    });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    // Cancelling returns stock, so pull fresh product numbers too.
    apiRequest<Product[]>('/api/products?includeInactive=true').then(setAdminProducts).catch(() => {});
  };

  const updateEnquiryStatus = async (enquiryId: string, status: BulkEnquiryStatus) => {
    const updated = await apiRequest<BulkEnquiry>(`/api/bulk-enquiries/${enquiryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setBulkEnquiries((prev) => prev.map((e) => (e.id === enquiryId ? updated : e)));
  };

  const saveCoupon = async (coupon: CouponInput) => {
    const { id, ...rest } = coupon;
    const saved = id
      ? await apiRequest<Coupon>(`/api/coupons/${id}`, { method: 'PUT', body: JSON.stringify(rest) })
      : await apiRequest<Coupon>('/api/coupons', { method: 'POST', body: JSON.stringify(rest) });
    setCoupons((prev) => upsertById(prev, saved));
  };

  const toggleCouponStatus = async (couponId: string) => {
    const updated = await apiRequest<Coupon>(`/api/coupons/${couponId}`, { method: 'PATCH' });
    setCoupons((prev) => prev.map((c) => (c.id === couponId ? updated : c)));
  };

  const updateSettings = async (newSettings: SiteSettings) => {
    const saved = await apiRequest<SiteSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(newSettings) });
    setSettings(saved);
  };

  const addStockAdjustment = async (productId: string, qtyChange: number, reason: string) => {
    const updated = await apiRequest<Product>('/api/stock-adjustments', {
      method: 'POST',
      body: JSON.stringify({ productId, qtyChange, reason }),
    });
    setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    setAdminProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
  };

  return (
    <LuminaryContext.Provider
      value={{
        formatPrice,
        products,
        adminProducts,
        cart,
        wishlist,
        orders,
        coupons,
        heroBanners,
        adminBanners,
        bulkEnquiries,
        activityLogs,
        sheetSyncLogs,
        settings,
        reviews,
        activeCoupon,
        activeCategoryFilter,
        setActiveCategoryFilter,
        paymentOptions,
        toast,
        showToast,
        dismissToast,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        refreshCart,
        toggleWishlist,
        applyCoupon,
        removeCoupon,
        getCartTotals,
        getUnitPriceForProduct,
        addReview,
        placeOrder,
        verifyPayment,
        cancelPayment,
        submitBulkEnquiry,
        customer,
        customerOrders,
        customerLogin,
        customerRegister,
        customerLogout,
        requestEmailCode,
        customerLoginWithCode,
        customerResetPassword,
        refreshCustomer,
        adminSession,
        adminAuthChecked,
        adminLogin,
        adminLogout,
        changeAdminPassword,
        refreshAdminData,
        saveProduct,
        deleteProduct,
        updateHeroBanners,
        reorderPriorityProducts,
        updateOrderStatus,
        updateEnquiryStatus,
        saveCoupon,
        toggleCouponStatus,
        updateSettings,
        addStockAdjustment,
      }}
    >
      {children}
    </LuminaryContext.Provider>
  );
};

export const useLuminary = () => {
  const context = useContext(LuminaryContext);
  if (!context) {
    throw new Error('useLuminary must be used within a LuminaryProvider');
  }
  return context;
};
