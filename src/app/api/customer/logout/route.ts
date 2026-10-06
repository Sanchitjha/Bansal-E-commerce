import { NextResponse } from 'next/server';
import { clearCustomerCookie } from '@/lib/customer-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearCustomerCookie(response);
  return response;
}
