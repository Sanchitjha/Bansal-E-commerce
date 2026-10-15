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

export function track(event: string, data?: object) {
  if (typeof window === 'undefined') return;
  if (data) {
    window.fbq?.('track', event, data);
  } else {
    window.fbq?.('track', event);
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
}
