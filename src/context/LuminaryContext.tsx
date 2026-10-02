'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  CurrencyCode,
  ReviewItem,
} from '@/types';

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

type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
type CouponInput = Omit<Coupon, 'id' | 'usageCount'> & { id?: string };

interface LuminaryContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amountInINR: number) => string;
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  coupons: Coupon[];
  heroBanners: HeroBanner[];
  bulkEnquiries: BulkEnquiry[];
  activityLogs: ActivityLog[];
  sheetSyncLogs: GoogleSheetSyncLog[];
  settings: SiteSettings;
  reviews: ReviewItem[];
  activeCoupon: Coupon | null;
  activeCategoryFilter: CategoryType | 'all';
  setActiveCategoryFilter: (cat: CategoryType | 'all') => void;

  // Cart & Wishlist
  addToCart: (product: Product, quantity?: number, selectedVariantId?: string) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  getCartTotals: () => CartTotals;
  getUnitPriceForProduct: (product: Product, quantity: number) => number;

  // Reviews & Quiz
  addReview: (review: Omit<ReviewItem, 'id' | 'date' | 'verified'>) => Promise<void>;
  checkPincodeDelivery: (pincode: string) => { available: boolean; estimatedDays: string; courier: string; cod: boolean };

  // Checkout & Orders
  placeOrder: (customerData: {
    customerName: string;
    phone: string;
    email: string;
    shippingAddress: string;
    city: string;
    state: string;
    pincode: string;
    paymentMethod: 'Razorpay' | 'Cashfree' | 'UPI' | 'Credit Card' | 'COD';
  }) => Promise<Order>;
  submitBulkEnquiry: (data: Omit<BulkEnquiry, 'id' | 'status' | 'createdAt'>) => Promise<void>;

  // Admin auth
  adminSession: AdminSession | null;
  adminAuthChecked: boolean;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  adminLogout: () => Promise<void>;
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

const CURRENCY_RATES: Record<CurrencyCode, { symbol: string; rate: number }> = {
  INR: { symbol: '₹', rate: 1 },
  USD: { symbol: '$', rate: 0.012 },
  EUR: { symbol: '€', rate: 0.011 },
  AED: { symbol: 'د.إ', rate: 0.044 },
};

const DEFAULT_SETTINGS: SiteSettings = {
  websiteName: 'LUMINARY',
  logoText: 'LUMINARY',
  contactPhone: '',
  contactEmail: '',
  address: '',
  whatsAppNumber: '',
  freeShippingThreshold: 999,
  defaultShippingCharge: 99,
  lowStockAlertThreshold: 10,
};

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

interface CartApiPayload {
  items: CartItem[];
  appliedCoupon: Coupon | null;
}

export const LuminaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Bright Light Mode is DEFAULT on first visit as requested by user!
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [bulkEnquiries, setBulkEnquiries] = useState<BulkEnquiry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [sheetSyncLogs, setSheetSyncLogs] = useState<GoogleSheetSyncLog[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [adminAuthChecked, setAdminAuthChecked] = useState(false);

  // Load / Save Theme & Currency (per-browser UI preference, not backend data)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('luminary_theme') as 'dark' | 'light';
      if (savedTheme) setTheme(savedTheme);
      const savedCurr = localStorage.getItem('luminary_curr') as CurrencyCode;
      if (savedCurr) setCurrency(savedCurr);
    } catch (e) {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('luminary_theme', theme);
    } catch (e) {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('luminary_curr', currency);
    } catch (e) {}
  }, [currency]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const formatPrice = (amountInINR: number): string => {
    const curr = CURRENCY_RATES[currency];
    const converted = amountInINR * curr.rate;
    if (currency === 'INR') {
      return `₹${Math.round(converted).toLocaleString()}`;
    } else if (currency === 'USD') {
      return `$${converted.toFixed(2)}`;
    } else if (currency === 'EUR') {
      return `€${converted.toFixed(2)}`;
    } else {
      return `د.إ ${converted.toFixed(2)}`;
    }
  };

  // Initial data load from the backend
  useEffect(() => {
    apiRequest<Product[]>('/api/products').then(setProducts).catch(() => {});
    apiRequest<HeroBanner[]>('/api/hero-banners').then(setHeroBanners).catch(() => {});
    apiRequest<SiteSettings>('/api/settings').then((s) => s && setSettings(s)).catch(() => {});
    apiRequest<CartApiPayload>('/api/cart').then((data) => {
      setCart(data.items || []);
      setActiveCoupon(data.appliedCoupon || null);
    }).catch(() => {});
    apiRequest<{ productIds: string[] }>('/api/wishlist').then((data) => setWishlist(data.productIds || [])).catch(() => {});
    apiRequest<AdminSession>('/api/auth/me')
      .then(setAdminSession)
      .catch(() => setAdminSession(null))
      .finally(() => setAdminAuthChecked(true));
  }, []);

  // Bulk Tier Price Calculator
  const getUnitPriceForProduct = (product: Product, quantity: number): number => {
    if (!product.isBulkAvailable || !product.bulkSlabs || product.bulkSlabs.length === 0) {
      return product.sellingPrice;
    }
    const sortedSlabs = [...product.bulkSlabs].sort((a, b) => b.minQty - a.minQty);
    const applicableSlab = sortedSlabs.find((slab) => quantity >= slab.minQty);
    return applicableSlab ? applicableSlab.pricePerUnit : product.sellingPrice;
  };

  const addToCart = async (product: Product, quantity: number = 1, selectedVariantId?: string) => {
    const data = await apiRequest<CartApiPayload>('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId: product.id, quantity, selectedVariantId }),
    });
    setCart(data.items || []);
    setActiveCoupon(data.appliedCoupon || null);
  };

  const removeFromCart = async (productId: string) => {
    const data = await apiRequest<CartApiPayload>(`/api/cart/${productId}`, { method: 'DELETE' });
    setCart(data.items || []);
    setActiveCoupon(data.appliedCoupon || null);
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    const data = await apiRequest<CartApiPayload>('/api/cart', {
      method: 'PATCH',
      body: JSON.stringify({ productId, quantity }),
    });
    setCart(data.items || []);
    setActiveCoupon(data.appliedCoupon || null);
  };

  const clearCart = async () => {
    await apiRequest('/api/cart', { method: 'DELETE' });
    setCart([]);
    setActiveCoupon(null);
  };

  const toggleWishlist = async (productId: string) => {
    const data = await apiRequest<{ productIds: string[] }>('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
    setWishlist(data.productIds || []);
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const data = await apiRequest<{ success: boolean; message: string; items?: CartItem[]; appliedCoupon?: Coupon | null }>(
      '/api/coupons/apply',
      { method: 'POST', body: JSON.stringify({ code }) }
    );
    if (data.success) {
      setCart(data.items || []);
      setActiveCoupon(data.appliedCoupon || null);
    }
    return { success: data.success, message: data.message };
  };

  const removeCoupon = async () => {
    const data = await apiRequest<CartApiPayload>('/api/coupons/apply', { method: 'DELETE' });
    setCart(data.items || []);
    setActiveCoupon(data.appliedCoupon || null);
  };

  const getCartTotals = (): CartTotals => {
    let subtotal = 0;
    let itemCount = 0;
    let mrpTotal = 0;

    cart.forEach((item) => {
      subtotal += item.totalPrice;
      itemCount += item.quantity;
      mrpTotal += item.product.mrp * item.quantity;
    });

    let couponDiscount = 0;
    if (activeCoupon && subtotal >= activeCoupon.minOrderValue) {
      if (activeCoupon.type === 'percentage') {
        couponDiscount = (subtotal * activeCoupon.value) / 100;
        if (activeCoupon.maxDiscount && couponDiscount > activeCoupon.maxDiscount) {
          couponDiscount = activeCoupon.maxDiscount;
        }
      } else {
        couponDiscount = activeCoupon.value;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
    const savings = Math.max(0, mrpTotal - discountedSubtotal);

    const shippingFee = discountedSubtotal >= settings.freeShippingThreshold || cart.length === 0 ? 0 : settings.defaultShippingCharge;

    const taxableAmount = Math.round((discountedSubtotal / 1.18) * 100) / 100;
    const gstAmount = Math.round((discountedSubtotal - taxableAmount) * 100) / 100;
    const cgst = Math.round((gstAmount / 2) * 100) / 100;
    const sgst = cgst;

    const grandTotal = Math.round((discountedSubtotal + shippingFee) * 100) / 100;

    return {
      subtotal,
      savings,
      appliedCoupon: activeCoupon,
      couponDiscount,
      taxableAmount,
      gstAmount,
      cgst,
      sgst,
      shippingFee,
      grandTotal,
      itemCount,
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

  const checkPincodeDelivery = (pincode: string) => {
    const clean = pincode.trim();
    if (!/^\d{6}$/.test(clean)) {
      return { available: false, estimatedDays: 'N/A', courier: 'N/A', cod: false };
    }
    const isMetro = ['11', '40', '56', '70', '60'].some((prefix) => clean.startsWith(prefix));
    return {
      available: true,
      estimatedDays: isMetro ? '2-3 Business Days' : '4-5 Business Days',
      courier: isMetro ? 'BlueDart Air Express' : 'Delhivery Surface',
      cod: true,
    };
  };

  const placeOrder = async (customerData: {
    customerName: string;
    phone: string;
    email: string;
    shippingAddress: string;
    city: string;
    state: string;
    pincode: string;
    paymentMethod: 'Razorpay' | 'Cashfree' | 'UPI' | 'Credit Card' | 'COD';
  }): Promise<Order> => {
    const order = await apiRequest<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
    setCart([]);
    setActiveCoupon(null);
    // Stock levels changed server-side; refresh the catalog so it reflects the new totals.
    apiRequest<Product[]>('/api/products').then(setProducts).catch(() => {});
    return order;
  };

  const submitBulkEnquiry = async (data: Omit<BulkEnquiry, 'id' | 'status' | 'createdAt'>) => {
    const enquiry = await apiRequest<BulkEnquiry>('/api/bulk-enquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setBulkEnquiries((prev) => [enquiry, ...prev]);
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
      return { success: false, message: err instanceof Error ? err.message : 'Login failed' };
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
  };

  const refreshAdminData = useCallback(async () => {
    const [ordersData, enquiriesData, activityData, sheetData, couponsData] = await Promise.all([
      apiRequest<Order[]>('/api/orders').catch(() => []),
      apiRequest<BulkEnquiry[]>('/api/bulk-enquiries').catch(() => []),
      apiRequest<ActivityLog[]>('/api/activity-logs').catch(() => []),
      apiRequest<GoogleSheetSyncLog[]>('/api/sheet-sync-logs').catch(() => []),
      apiRequest<Coupon[]>('/api/coupons').catch(() => []),
    ]);
    setOrders(ordersData);
    setBulkEnquiries(enquiriesData);
    setActivityLogs(activityData);
    setSheetSyncLogs(sheetData);
    setCoupons(couponsData);
  }, []);

  const saveProduct = async (product: ProductInput) => {
    const { id, ...rest } = product;
    const saved = id
      ? await apiRequest<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(rest) })
      : await apiRequest<Product>('/api/products', { method: 'POST', body: JSON.stringify(rest) });
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
  };

  const deleteProduct = async (productId: string) => {
    await apiRequest(`/api/products/${productId}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const updateHeroBanners = async (banners: HeroBanner[]) => {
    const saved = await apiRequest<HeroBanner[]>('/api/hero-banners', { method: 'PUT', body: JSON.stringify(banners) });
    setHeroBanners(saved);
  };

  const reorderPriorityProducts = async (priorityProductIds: string[]) => {
    await Promise.all(
      products.map((prod) => {
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
    const refreshed = await apiRequest<Product[]>('/api/products');
    setProducts(refreshed);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, courier?: string, trackingNumber?: string) => {
    const updated = await apiRequest<Order>(`/api/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ orderStatus: status, courier, trackingNumber }),
    });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
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
    setCoupons((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
    });
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
  };

  return (
    <LuminaryContext.Provider
      value={{
        theme,
        toggleTheme,
        currency,
        setCurrency,
        formatPrice,
        products,
        cart,
        wishlist,
        orders,
        coupons,
        heroBanners,
        bulkEnquiries,
        activityLogs,
        sheetSyncLogs,
        settings,
        reviews,
        activeCoupon,
        activeCategoryFilter,
        setActiveCategoryFilter,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        applyCoupon,
        removeCoupon,
        getCartTotals,
        getUnitPriceForProduct,
        addReview,
        checkPincodeDelivery,
        placeOrder,
        submitBulkEnquiry,
        adminSession,
        adminAuthChecked,
        adminLogin,
        adminLogout,
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
