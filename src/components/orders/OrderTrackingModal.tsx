'use client';

import React, { useState } from 'react';
import { X, Search, Package, CheckCircle2, Clock, Truck, MapPin, AlertCircle, FileText } from 'lucide-react';
import { Order, OrderStatus } from '@/types';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [searchId, setSearchId] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = searchId.trim();
    if (!id || !searchPhone.trim()) return;

    setIsSearching(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/orders/track?id=${encodeURIComponent(id)}&phone=${encodeURIComponent(searchPhone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchedOrder(null);
        setLookupError(data.error || 'Could not look up this order.');
      } else {
        setSearchedOrder(data.order || null);
      }
    } catch {
      setSearchedOrder(null);
      setLookupError('Could not reach the server. Please try again.');
    } finally {
      setSearched(true);
      setIsSearching(false);
    }
  };

  const statusSteps: OrderStatus[] = [
    'Pending Payment',
    'Payment Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
  ];

  const getStepIndex = (status: OrderStatus) => {
    return statusSteps.indexOf(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden animate-fade-in text-slate-900 my-8">
        <div className="p-6 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-green-50 text-brand-green-700 border border-stone-200">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className=" text-lg font-bold text-slate-900">Live Order Tracking</h3>
              <p className="text-xs text-slate-500">Enter your Order ID and the mobile number used at checkout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-slate-500 hover:text-brand-green-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              placeholder="Order ID (e.g. LF-20261007-123456)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-500 outline-none font-mono"
            />
            <input
              type="tel"
              required
              inputMode="numeric"
              placeholder="Mobile number used for the order"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-500 outline-none"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2.5 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white  font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition flex items-center gap-1.5 disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'Searching...' : 'Track'}</span>
            </button>
          </form>

          {/* Results Display */}
          {searchedOrder ? (
            <div className="space-y-6 pt-2 border-t border-stone-200">
              {/* Status Header */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Order Reference</span>
                  <h4 className="font-mono text-base font-bold text-brand-green-700">{searchedOrder.id}</h4>
                  <p className="text-[11px] text-slate-500">{new Date(searchedOrder.date).toLocaleString()} • {searchedOrder.customerName}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Current Status</span>
                  <div className="px-3 py-1 rounded-full bg-brand-green-50 border border-brand-green-600/40 text-brand-green-700 font-bold text-xs inline-block mt-0.5">
                    {searchedOrder.orderStatus}
                  </div>
                  {searchedOrder.courier && (
                    <p className="text-[11px] text-slate-700 mt-1 font-mono">
                      {searchedOrder.courier} ({searchedOrder.trackingNumber || 'N/A'})
                    </p>
                  )}
                </div>
              </div>

              {/* Workflow Stepper */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-brand-green-700 mb-3">
                  Shipment Progress Steps
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                  {statusSteps.slice(1, 6).map((step, idx) => {
                    const activeIdx = getStepIndex(searchedOrder.orderStatus);
                    const isPassed = activeIdx >= idx + 1;
                    return (
                      <div
                        key={step}
                        className={`p-2.5 rounded-xl border transition ${
                          isPassed
                            ? 'bg-brand-green-50 border-brand-green-600 text-brand-green-700 font-bold'
                            : 'bg-stone-50 border-stone-200 text-slate-500'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full mx-auto mb-1 flex items-center justify-center text-[10px]">
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <span>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items & Shipping Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <span className="font-bold text-slate-700 block border-b border-stone-200 pb-1">
                    Purchased Items ({searchedOrder.items.length})
                  </span>
                  {searchedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-slate-700">
                      <span className="truncate max-w-[180px]">{item.productName}</span>
                      <span className="font-mono text-brand-green-700 font-bold">
                        x{item.quantity} = ₹{item.totalPrice}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-stone-200 font-bold flex justify-between text-slate-900">
                    <span>Order Total</span>
                    <span className="font-mono text-brand-green-700">₹{searchedOrder.totalAmount}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <span className="font-bold text-slate-700 block border-b border-stone-200 pb-1">
                    Shipping & Payment
                  </span>
                  <p className="text-slate-500">{searchedOrder.shippingAddress}, {searchedOrder.city}, {searchedOrder.state} - {searchedOrder.pincode}</p>
                  <p className="text-slate-500">Payment: <strong className="text-slate-800">{searchedOrder.paymentMethod}</strong> ({searchedOrder.paymentStatus})</p>
                  {searchedOrder.accessToken && (
                    <a
                      href={`/invoice/${encodeURIComponent(searchedOrder.id)}?t=${searchedOrder.accessToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-brand-green-700 hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" /> View invoice
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : searched ? (
            <div className="p-8 text-center text-slate-500 space-y-2 border-t border-stone-200">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <p className="font-semibold text-slate-800">{lookupError ?? `No order found for '${searchId}' with that mobile number`}</p>
              {!lookupError && <p className="text-xs">Please check your order ID and the mobile number you used at checkout.</p>}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
