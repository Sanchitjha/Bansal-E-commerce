import { NextResponse } from 'next/server';
import { db, plain } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { TrafficEvent, Order } = await db();

    const [pageViews, productViews, addToCarts, initiateCheckouts, purchases, recentEvents] = await Promise.all([
      TrafficEvent.countDocuments({ eventType: 'page_view' }),
      TrafficEvent.countDocuments({ eventType: 'product_view' }),
      TrafficEvent.countDocuments({ eventType: 'add_to_cart' }),
      TrafficEvent.countDocuments({ eventType: 'initiate_checkout' }),
      TrafficEvent.countDocuments({ eventType: 'purchase' }),
      TrafficEvent.find({}).sort({ timestamp: -1 }).limit(25),
    ]);

    // Also get verified orders count from Order collection as baseline
    const verifiedOrdersCount = await Order.countDocuments({});

    const totalPurchases = Math.max(purchases, verifiedOrdersCount);
    const conversionRate = pageViews > 0 ? ((totalPurchases / pageViews) * 100).toFixed(2) : '0.00';

    return NextResponse.json({
      funnel: {
        pageViews,
        productViews,
        addToCarts,
        initiateCheckouts,
        purchases: totalPurchases,
        conversionRate,
      },
      recentEvents: plain(recentEvents),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
