'use client';

import React from 'react';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { CategoryType } from '@/types';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenBulkModal: () => void;
  onOpenTrackOrder: () => void;
  onOpenReviewModal: () => void;
}

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenBulkModal, onOpenTrackOrder, onOpenReviewModal }) => {
  const { settings, setActiveCategoryFilter } = useLuminary();

  const openWhatsApp = () => {
    const text = encodeURIComponent('Hello Luminary Team, I would like to enquire about your products.');
    window.open(`https://wa.me/${settings.whatsAppNumber}?text=${text}`, '_blank');
  };

  const goToCategory = (cat: CategoryType) => {
    setActiveCategoryFilter(cat);
    scrollToId('shop');
  };

  const heading = 'text-sm font-bold text-slate-900 mb-4';
  const link = 'block text-left text-sm text-slate-600 hover:text-brand-green-700 transition py-1';
  const plain = 'block text-sm text-slate-500 py-1';

  return (
    <footer className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-8">
      <div className="bg-brand-sage rounded-3xl px-6 sm:px-10 pt-10 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div>
            <h4 className={heading}>Shop</h4>
            <button className={link} onClick={() => goToCategory('fragrance')}>Fragrances</button>
            <button className={link} onClick={() => goToCategory('ayurvedic')}>Ayurvedic Care</button>
            <button className={link} onClick={() => goToCategory('gadgets')}>Mini Gadgets</button>
            <button className={link} onClick={() => scrollToId('bestsellers')}>Bestsellers</button>
          </div>

          <div>
            <h4 className={heading}>Your Account</h4>
            <button className={link} onClick={onOpenTrackOrder}>Track Order</button>
            <button className={link} onClick={onOpenReviewModal}>Rewards</button>
            <button className={link} onClick={onOpenBulkModal}>Bulk Enquiry</button>
            <button className={link} onClick={onOpenAdmin}>Admin Login</button>
          </div>

          <div>
            <h4 className={heading}>Policies</h4>
            <span className={plain}>Terms & Conditions</span>
            <span className={plain}>Privacy Policy</span>
            <span className={plain}>Shipping Policy</span>
            <span className={plain}>Return Policy</span>
          </div>

          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <h4 className={heading}>Get in Touch</h4>
            <div className="space-y-2.5 text-sm text-slate-600">
              {settings.contactPhone && (
                <a href={`tel:${settings.contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2.5 hover:text-brand-green-700">
                  <Phone className="w-4 h-4 text-brand-green-700 shrink-0" />
                  {settings.contactPhone}
                </a>
              )}
              {settings.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2.5 hover:text-brand-green-700 break-all">
                  <Mail className="w-4 h-4 text-brand-green-700 shrink-0" />
                  {settings.contactEmail}
                </a>
              )}
              {settings.address && (
                <p className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-green-700 shrink-0 mt-0.5" />
                  {settings.address}
                </p>
              )}
              <button
                onClick={openWhatsApp}
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full bg-brand-green-700 hover:bg-brand-green-800 text-white text-sm font-semibold transition"
              >
                <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-stone-300/70 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Luminary. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
