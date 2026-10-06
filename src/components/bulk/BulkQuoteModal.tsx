'use client';

import React, { useState } from 'react';
import { X, Layers, Send, CheckCircle2, PhoneCall } from 'lucide-react';
import { Product } from '@/types';
import { useLuminary } from '@/context/LuminaryContext';

interface BulkQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedProduct?: Product | null;
}

export const BulkQuoteModal: React.FC<BulkQuoteModalProps> = ({
  isOpen,
  onClose,
  preSelectedProduct,
}) => {
  if (!isOpen) return null;

  const { products, submitBulkEnquiry } = useLuminary();

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    mobile: '',
    email: '',
    productName: preSelectedProduct ? preSelectedProduct.name : products[0]?.name || 'Luminary Royal Imperial Oud EDP',
    quantity: 50,
    expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    message: '',
  });

  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitBulkEnquiry(formData);
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden animate-fade-in text-slate-900">
        <div className="p-6 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-green-50 text-brand-green-700 border border-stone-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className=" text-lg font-bold text-slate-900">Request Bulk Wholesale Quote</h3>
              <p className="text-xs text-slate-500">Direct B2B Pricing for Corporate & Luxury Hospitality</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-slate-500 hover:text-brand-green-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className=" text-xl font-bold text-slate-900">Enquiry Submitted Successfully!</h4>
            <p className="text-xs text-slate-700 max-w-sm mx-auto leading-relaxed">
              Our B2B Corporate Desk has received your request. A dedicated luxury representative will reach out to you within 2 business hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rajesh Mehta"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Company / Resort Name
                </label>
                <input
                  type="text"
                  placeholder="Taj Luxury Hotels"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98190 55443"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="rmehta@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Selected Product *
              </label>
              <select
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Required Quantity *
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Custom Requirements / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Mention co-branding, custom velvet boxes, or specific fragrance notes..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:border-brand-green-600 rounded-xl text-slate-900 placeholder-slate-500 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white  font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition flex items-center justify-center gap-2 "
            >
              <Send className="w-4 h-4" />
              <span>SUBMIT BULK QUOTE ENQUIRY</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
