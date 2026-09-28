import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = code.trim();

  if (!/^\d{6}$/.test(clean)) {
    return NextResponse.json({ available: false, estimatedDays: 'N/A', courier: 'N/A', cod: false });
  }

  const isMetro = ['11', '40', '56', '70', '60'].some((prefix) => clean.startsWith(prefix));
  return NextResponse.json({
    available: true,
    estimatedDays: isMetro ? '2-3 Business Days' : '4-5 Business Days',
    courier: isMetro ? 'BlueDart Air Express' : 'Delhivery Surface',
    cod: true,
  });
}
