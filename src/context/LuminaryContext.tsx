'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
import {
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_BULK_ENQUIRIES,
  INITIAL_HERO_BANNERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_SHEET_LOGS,
  INITIAL_SETTINGS,
} from '@/data/mockData';

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
  addToCart: (product: Product, quantity?: number, selectedVariantId?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  getCartTotals: () => CartTotals;
  getUnitPriceForProduct: (product: Product, quantity: number) => number;

  // Reviews & Quiz
  addReview: (review: Omit<ReviewItem, 'id' | 'date' | 'verified'>) => void;
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
  }) => Order;
  submitBulkEnquiry: (data: Omit<BulkEnquiry, 'id' | 'status' | 'createdAt'>) => void;

  // Admin Actions
  saveProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateHeroBanners: (banners: HeroBanner[]) => void;
  reorderPriorityProducts: (priorityProductIds: string[]) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, courier?: string, trackingNumber?: string) => void;
  updateEnquiryStatus: (enquiryId: string, status: BulkEnquiryStatus) => void;
  saveCoupon: (coupon: Coupon) => void;
  toggleCouponStatus: (couponId: string) => void;
  updateSettings: (newSettings: SiteSettings) => void;
  addStockAdjustment: (productId: string, qtyChange: number, reason: string) => void;
}

const LuminaryContext = createContext<LuminaryContextType | undefined>(undefined);

const CURRENCY_RATES: Record<CurrencyCode, { symbol: string; rate: number }> = {
  INR: { symbol: '₹', rate: 1 },
  USD: { symbol: '$', rate: 0.012 },
  EUR: { symbol: '€', rate: 0.011 },
  AED: { symbol: 'د.إ', rate: 0.044 },
};

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    author: 'Princess Ananya Singh',
    location: 'Udaipur, RJ',
    rating: 5,
    title: 'Hypnotic Oud & Unmatched Longevity',
    content: 'The Royal Imperial Oud EDP is beyond divine. The richness of Assam Oud blended with velvet rose lasts for over 24 hours.',
    date: '2026-09-20',
    verified: true,
  },
  {
    id: 'rev-2',
    productId: 'prod-4',
    author: 'Dr. Siddharth Vardhan',
    location: 'Bengaluru, KA',
    rating: 5,
    title: 'Transformed My Night Skin Routine',
    content: 'The 24K Gold Kumkumadi Night Elixir is the only authentic Ayurvedic serum that actually works without feeling greasy.',
    date: '2026-09-22',
    verified: true,
  },
];

export const LuminaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Bright Light Mode is DEFAULT on first visit as requested by user!
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>(INITIAL_HERO_BANNERS);
  const [bulkEnquiries, setBulkEnquiries] = useState<BulkEnquiry[]>(INITIAL_BULK_ENQUIRIES);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [sheetSyncLogs, setSheetSyncLogs] = useState<GoogleSheetSyncLog[]>(INITIAL_SHEET_LOGS);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryType | 'all'>('all');

  // Load / Save Theme & Currency
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('luminary_theme') as 'dark' | 'light';
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        setTheme('light'); // Default Light Mode!
      }
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

  // Load / Save state to LocalStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('luminary_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
      const savedWishlist = localStorage.getItem('luminary_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      const savedProducts = localStorage.getItem('luminary_products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      const savedOrders = localStorage.getItem('luminary_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch (e) {
      console.error('LocalStorage load error', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('luminary_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('luminary_wishlist', JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('luminary_products', JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('luminary_orders', JSON.stringify(orders));
    } catch (e) {}
  }, [orders]);

  // Bulk Tier Price Calculator
  const getUnitPriceForProduct = (product: Product, quantity: number): number => {
    if (!product.isBulkAvailable || !product.bulkSlabs || product.bulkSlabs.length === 0) {
      return product.sellingPrice;
    }
    const sortedSlabs = [...product.bulkSlabs].sort((a, b) => b.minQty - a.minQty);
    const applicableSlab = sortedSlabs.find((slab) => quantity >= slab.minQty);
    return applicableSlab ? applicableSlab.pricePerUnit : product.sellingPrice;
  };

  const addToCart = (product: Product, quantity: number = 1, selectedVariantId?: string) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedVariantId === selectedVariantId
      );
      if (existingIndex > -1) {
        const newCart = [...prevCart];
        const newQty = newCart[existingIndex].quantity + quantity;
        const unitPrice = getUnitPriceForProduct(product, newQty);
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newQty,
          unitPrice,
          totalPrice: unitPrice * newQty,
        };
        return newCart;
      } else {
        const unitPrice = getUnitPriceForProduct(product, quantity);
        return [
          ...prevCart,
          {
            product,
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity,
            selectedVariantId,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const unitPrice = getUnitPriceForProduct(item.product, quantity);
          return {
            ...item,
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setActiveCoupon(null);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code === cleanCode && c.isActive);

    if (!found) {
      return { success: false, message: 'Invalid or expired coupon code.' };
    }

    const { subtotal } = getCartTotals();
    if (subtotal < found.minOrderValue) {
      return {
        success: false,
        message: `Minimum order value of ₹${found.minOrderValue} required for ${found.code}.`,
      };
    }

    setActiveCoupon(found);
    return { success: true, message: `Coupon '${found.code}' applied successfully!` };
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
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

  const addReview = (newReviewData: Omit<ReviewItem, 'id' | 'date' | 'verified'>) => {
    const rev: ReviewItem = {
      ...newReviewData,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      verified: true,
    };
    setReviews((prev) => [rev, ...prev]);
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

  const logActivity = (action: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      adminName: 'Admin',
      action,
      timestamp: new Date().toLocaleString(),
      details,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const logGoogleSheetSync = (sheetName: GoogleSheetSyncLog['sheetName'], orderId: string, event: string) => {
    const newSync: GoogleSheetSyncLog = {
      id: `sync-${Date.now()}`,
      sheetName,
      orderId,
      event,
      timestamp: new Date().toLocaleString(),
      status: 'Synced',
    };
    setSheetSyncLogs((prev) => [newSync, ...prev]);
  };

  const placeOrder = (customerData: {
    customerName: string;
    phone: string;
    email: string;
    shippingAddress: string;
    city: string;
    state: string;
    pincode: string;
    paymentMethod: 'Razorpay' | 'Cashfree' | 'UPI' | 'Credit Card' | 'COD';
  }): Order => {
    const totals = getCartTotals();
    const orderNum = Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderId = `LF-${dateStr}-${orderNum}`;

    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      mrp: item.product.mrp,
      sellingPrice: item.product.sellingPrice,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      gstAmount: Math.round((item.totalPrice * (item.product.gstRate / 100)) * 100) / 100,
    }));

    const isMaharashtra = customerData.state.toLowerCase().includes('maharashtra');

    const newOrder: Order = {
      id: orderId,
      date: new Date().toLocaleString(),
      customerName: customerData.customerName,
      phone: customerData.phone,
      email: customerData.email,
      shippingAddress: customerData.shippingAddress,
      city: customerData.city,
      state: customerData.state,
      pincode: customerData.pincode,
      items: orderItems,
      subtotal: totals.subtotal,
      discount: totals.couponDiscount,
      couponCode: activeCoupon?.code,
      taxableAmount: totals.taxableAmount,
      gstAmount: totals.gstAmount,
      cgst: isMaharashtra ? totals.cgst : 0,
      sgst: isMaharashtra ? totals.sgst : 0,
      igst: !isMaharashtra ? totals.gstAmount : 0,
      shippingFee: totals.shippingFee,
      totalAmount: totals.grandTotal,
      paymentMethod: customerData.paymentMethod,
      paymentStatus: customerData.paymentMethod === 'COD' ? 'Pending' : 'Paid',
      orderStatus: 'Payment Confirmed',
    };

    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const itemInCart = cart.find((c) => c.product.id === prod.id);
        if (itemInCart) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - itemInCart.quantity),
          };
        }
        return prod;
      })
    );

    setOrders((prev) => [newOrder, ...prev]);

    logGoogleSheetSync('SALES REGISTER', orderId, `Appended order ${orderId} customer ${customerData.customerName}`);
    logGoogleSheetSync('PRODUCT SALES', orderId, `Updated product sales units for order ${orderId}`);
    logGoogleSheetSync('MONTHLY SUMMARY', orderId, `Updated monthly revenue by +₹${totals.grandTotal}`);

    logActivity(`Created Order ${orderId}`, `Customer: ${customerData.customerName}, Total: ₹${totals.grandTotal}`);
    clearCart();
    return newOrder;
  };

  const submitBulkEnquiry = (data: Omit<BulkEnquiry, 'id' | 'status' | 'createdAt'>) => {
    const newEnquiry: BulkEnquiry = {
      ...data,
      id: `ENQ-${Date.now().toString().slice(-6)}`,
      status: 'New',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBulkEnquiries((prev) => [newEnquiry, ...prev]);
    logActivity(`Received Bulk Quote Request`, `${data.company || data.name} requested ${data.quantity} units of ${data.productName}`);
  };

  const saveProduct = (product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        logActivity(`Updated Product`, `Edited ${product.name} (SKU: ${product.sku})`);
        return prev.map((p) => (p.id === product.id ? product : p));
      } else {
        logActivity(`Created New Product`, `Added ${product.name} (SKU: ${product.sku})`);
        return [product, ...prev];
      }
    });
  };

  const deleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (target) {
      logActivity(`Deleted Product`, `Removed ${target.name}`);
    }
  };

  const updateHeroBanners = (banners: HeroBanner[]) => {
    setHeroBanners(banners);
    logActivity(`Updated Hero Banners`, `Reordered / updated hero carousel slides`);
  };

  const reorderPriorityProducts = (priorityProductIds: string[]) => {
    setProducts((prev) =>
      prev.map((prod) => {
        const index = priorityProductIds.indexOf(prod.id);
        if (index > -1) {
          return {
            ...prod,
            isHomepagePriority: true,
            priorityOrder: index + 1,
          };
        }
        return {
          ...prod,
          isHomepagePriority: false,
        };
      })
    );
    logActivity(`Reordered Homepage Priority Products`, `Updated priority sequence`);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, courier?: string, trackingNumber?: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            orderStatus: status,
            courier: courier || ord.courier,
            trackingNumber: trackingNumber || ord.trackingNumber,
          };
        }
        return ord;
      })
    );
    logActivity(`Updated Order Status`, `Order ${orderId} status set to ${status}`);
    logGoogleSheetSync('SALES REGISTER', orderId, `Status updated to ${status}`);
  };

  const updateEnquiryStatus = (enquiryId: string, status: BulkEnquiryStatus) => {
    setBulkEnquiries((prev) =>
      prev.map((enq) => (enq.id === enquiryId ? { ...enq, status } : enq))
    );
    logActivity(`Updated Bulk Enquiry Status`, `Enquiry ${enquiryId} set to ${status}`);
  };

  const saveCoupon = (coupon: Coupon) => {
    setCoupons((prev) => {
      const exists = prev.some((c) => c.id === coupon.id);
      if (exists) {
        return prev.map((c) => (c.id === coupon.id ? coupon : c));
      } else {
        return [coupon, ...prev];
      }
    });
    logActivity(`Saved Coupon Code`, `Code: ${coupon.code}`);
  };

  const toggleCouponStatus = (couponId: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const updateSettings = (newSettings: SiteSettings) => {
    setSettings(newSettings);
    logActivity(`Updated Website Settings`, `Store settings modified`);
  };

  const addStockAdjustment = (productId: string, qtyChange: number, reason: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock + qtyChange);
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
    const target = products.find((p) => p.id === productId);
    logActivity(`Inventory Stock Adjustment`, `${target?.name || productId}: ${qtyChange > 0 ? '+' : ''}${qtyChange} units (${reason})`);
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
