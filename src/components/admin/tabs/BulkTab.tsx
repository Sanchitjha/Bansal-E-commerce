'use client';

import React from 'react';
import { useLuminary } from '@/context/LuminaryContext';
import { BulkEnquiryStatus } from '@/types';
import { card, errText } from '../ui';

const STATUSES: BulkEnquiryStatus[] = ['New', 'Contacted', 'Quotation Sent', 'Negotiation', 'Confirmed', 'Rejected', 'Completed'];

export const BulkTab: React.FC = () => {
  const { bulkEnquiries, updateEnquiryStatus, showToast } = useLuminary();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif text-lg font-bold text-slate-100">Bulk / wholesale enquiries ({bulkEnquiries.length})</h3>
        <p className="text-xs text-slate-400">Quote requests from the website. Move each one through your sales pipeline.</p>
      </div>

      <div className="space-y-3">
        {bulkEnquiries.map((enq) => (
          <div key={enq.id} className={`${card} p-4 space-y-2`}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <div className="min-w-0">
                <h5 className="font-bold text-slate-100 text-sm truncate">{enq.company || enq.name}</h5>
                <span className="text-[10px] text-slate-500 font-mono">{enq.id} · {new Date(enq.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <select
                value={enq.status}
                onChange={(e) =>
                  updateEnquiryStatus(enq.id, e.target.value as BulkEnquiryStatus).catch((err) => showToast(errText(err), 'error'))
                }
                className="px-2 py-1 text-xs bg-obsidian-900 border border-amber-500/40 text-amber-300 font-bold rounded outline-none shrink-0"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block">Contact</span>
                <span>{enq.name}</span>
                <a className="block text-gold-300 hover:underline" href={`tel:${enq.mobile}`}>{enq.mobile}</a>
                <a className="block text-gold-300 hover:underline break-all" href={`mailto:${enq.email}`}>{enq.email}</a>
              </div>
              <div>
                <span className="text-slate-500 block">Product</span>
                <span className="font-semibold text-slate-200">{enq.productName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Quantity</span>
                <span className="font-mono font-bold text-gold-300">{enq.quantity} units</span>
              </div>
              <div>
                <span className="text-slate-500 block">Needed by</span>
                <span>{enq.expectedDate || '-'}</span>
              </div>
            </div>
            {enq.message && <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">{enq.message}</p>}
          </div>
        ))}
        {bulkEnquiries.length === 0 && <p className="text-center text-sm text-slate-500 py-10">No enquiries yet.</p>}
      </div>
    </div>
  );
};
