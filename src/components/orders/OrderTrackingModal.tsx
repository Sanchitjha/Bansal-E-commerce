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
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = searchId.trim();
    if (!id) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/orders/track?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      setSearchedOrder(data.order || null);
    } catch {
      setSearchedOrder(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-obsidian-900 border border-gold-500/30 rounded-3xl shadow-2xl overflow-hidden animate-fade-in text-slate-100 my-8">
        <div className="p-6 bg-obsidian-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-100">Live Order Tracking</h3>
              <p className="text-xs text-slate-400">Track shipment status with Order ID or Registered Mobile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-gold-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter your Order ID (e.g. LF-20260928-000001)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-obsidian-950 border border-slate-800 focus:border-gold-500 rounded-xl text-slate-100 placeholder-slate-500 outline-none font-mono"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2.5 rounded-xl gold-gradient-bg text-obsidian-950 font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:scale-105 transition flex items-center gap-1.5 disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'Searching...' : 'Track'}</span>
            </button>
          </form>

          {/* Results Display */}
          {searchedOrder ? (
            <div className="space-y-6 pt-2 border-t border-slate-800">
              {/* Status Header */}
              <div className="p-4 rounded-2xl bg-obsidian-950 border border-gold-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Order Reference</span>
                  <h4 className="font-mono text-base font-bold text-gold-300">{searchedOrder.id}</h4>
                  <p className="text-[11px] text-slate-400">{new Date(searchedOrder.date).toLocaleString()} • {searchedOrder.customerName}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Status</span>
                  <div className="px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-300 font-bold text-xs inline-block mt-0.5">
                    {searchedOrder.orderStatus}
                  </div>
                  {searchedOrder.courier && (
                    <p className="text-[11px] text-slate-300 mt-1 font-mono">
                      {searchedOrder.courier} ({searchedOrder.trackingNumber || 'N/A'})
                    </p>
                  )}
                </div>
              </div>

              {/* Workflow Stepper */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-3">
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
                            ? 'bg-gold-500/20 border-gold-400 text-gold-300 font-bold'
                            : 'bg-obsidian-950 border-slate-800 text-slate-500'
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
                <div className="p-3.5 rounded-xl bg-obsidian-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300 block border-b border-slate-800 pb-1">
                    Purchased Items ({searchedOrder.items.length})
                  </span>
                  {searchedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-slate-300">
                      <span className="truncate max-w-[180px]">{item.productName}</span>
                      <span className="font-mono text-gold-300 font-bold">
                        x{item.quantity} = ₹{item.totalPrice}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-800 font-bold flex justify-between text-slate-100">
                    <span>Order Total</span>
                    <span className="font-mono text-gold-300">₹{searchedOrder.totalAmount}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-obsidian-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300 block border-b border-slate-800 pb-1">
                    Shipping & Payment
                  </span>
                  <p className="text-slate-400">{searchedOrder.shippingAddress}, {searchedOrder.city}, {searchedOrder.state} - {searchedOrder.pincode}</p>
                  <p className="text-slate-400">Payment: <strong className="text-slate-200">{searchedOrder.paymentMethod}</strong> ({searchedOrder.paymentStatus})</p>
                </div>
              </div>
            </div>
          ) : searched ? (
            <div className="p-8 text-center text-slate-400 space-y-2 border-t border-slate-800">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="font-semibold text-slate-200">No order found with reference '{searchId}'</p>
              <p className="text-xs">Please verify your order confirmation ID or contact Concierge.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
