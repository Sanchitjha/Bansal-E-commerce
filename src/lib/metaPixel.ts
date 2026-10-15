export type TrackableProduct = {
  id: string;
  name: string;
  price: number;
  quantity?: number;
};

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

function logToAdminAnalytics(payload: {
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'initiate_checkout' | 'purchase';
  eventName: string;
  url?: string;
  productId?: string;
  productName?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}) {
  if (typeof window === 'undefined') return;
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      url: payload.url || window.location.pathname,
    }),
  }).catch(() => {});
}

export function track(event: string, data?: object) {
  if (typeof window === 'undefined') return;
  if (data) {
    window.fbq?.('track', event, data);
  } else {
    window.fbq?.('track', event);
  }

  if (event === 'PageView') {
    logToAdminAnalytics({
      eventType: 'page_view',
      eventName: 'Customer viewed page',
    });
  }
}

export function trackViewContent(product: TrackableProduct) {
  track('ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: 'INR',
  });

  logToAdminAnalytics({
    eventType: 'product_view',
    eventName: `Viewed ${product.name}`,
    productId: product.id,
    productName: product.name,
    value: product.price,
  });
}

export function trackAddToCart(product: TrackableProduct) {
  const quantity = product.quantity ?? 1;

  track('AddToCart', {
    content_ids: [product.id],
    contents: [{ id: product.id, quantity }],
    content_type: 'product',
    value: product.price * quantity,
    currency: 'INR',
  });

  logToAdminAnalytics({
    eventType: 'add_to_cart',
    eventName: `Added to cart (${quantity}x ${product.name})`,
    productId: product.id,
    productName: product.name,
    value: product.price * quantity,
    metadata: { quantity },
  });
}

export function trackInitiateCheckout(
  products: TrackableProduct[],
  checkoutTotal: number
) {
  track('InitiateCheckout', {
    content_ids: products.map((p) => p.id),
    contents: products.map((p) => ({
      id: p.id,
      quantity: p.quantity ?? 1,
    })),
    content_type: 'product',
    value: checkoutTotal,
    currency: 'INR',
  });

  logToAdminAnalytics({
    eventType: 'initiate_checkout',
    eventName: `Checkout initiated for ${products.length} item(s)`,
    value: checkoutTotal,
    metadata: { itemCount: products.length },
  });
}

const trackedOrders = new Set<string>();

export function trackPurchase(order: {
  id: string;
  totalAmount: number;
  items: Array<{ sku?: string; productId?: string; quantity: number }>;
}) {
  if (!order || !order.id) return;

  if (typeof window !== 'undefined') {
    const storageKey = `meta_pixel_purchase_${order.id}`;
    try {
      if (sessionStorage.getItem(storageKey) || trackedOrders.has(order.id)) {
        return;
      }
      sessionStorage.setItem(storageKey, 'true');
    } catch {
      if (trackedOrders.has(order.id)) return;
    }
    trackedOrders.add(order.id);
  }

  track('Purchase', {
    value: order.totalAmount,
    currency: 'INR',
    content_ids: order.items.map((item) => item.sku || item.productId || ''),
    contents: order.items.map((item) => ({
      id: item.sku || item.productId || '',
      quantity: item.quantity,
    })),
    content_type: 'product',
  });

  logToAdminAnalytics({
    eventType: 'purchase',
    eventName: `Order Confirmed: ${order.id} (₹${order.totalAmount})`,
    value: order.totalAmount,
    metadata: { orderId: order.id, itemCount: order.items.length },
  });
}
