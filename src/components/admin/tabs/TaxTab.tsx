'use client';

import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { downloadCSV } from '../csv';
import { btnGhost, card, inr } from '../ui';

const EXCLUDED = ['Pending Payment', 'Cancelled', 'Returned', 'Refunded'];

export const TaxTab: React.FC = () => {
  const { orders, settings } = useLuminary();
  const [month, setMonth] = useState('all');

  const taxable = useMemo(() => orders.filter((o) => !EXCLUDED.includes(o.orderStatus)), [orders]);
  const months = useMemo(
    () => Array.from(new Set(taxable.map((o) => new Date(o.date).toLocaleDateString('en-CA').slice(0, 7)))).sort().reverse(),
    [taxable]
  );
  const rows = taxable.filter((o) => month === 'all' || new Date(o.date).toLocaleDateString('en-CA').startsWith(month));

  const sum = (pick: (o: (typeof rows)[number]) => number) => rows.reduce((total, o) => total + pick(o), 0);
  const totals = { taxable: sum((o) => o.taxableAmount), gst: sum((o) => o.gstAmount), cgst: sum((o) => o.cgst), sgst: sum((o) => o.sgst), igst: sum((o) => o.igst), total: sum((o) => o.totalAmount) };

  const exportCsv = () =>
    downloadCSV(`gst-report-${month}.csv`, [
      ['Invoice no', 'Date', 'Customer', 'Place of supply', 'Taxable value', 'GST total', 'CGST', 'SGST', 'IGST', 'Invoice value', 'Seller GSTIN'],
      ...rows.map((o) => [o.id, new Date(o.date).toLocaleDateString('en-IN'), o.customerName, o.state, o.taxableAmount, o.gstAmount, o.cgst, o.sgst, o.igst, o.totalAmount, settings.gstin]),
      ['TOTAL', '', '', '', totals.taxable, totals.gst, totals.cgst, totals.sgst, totals.igst, totals.total, ''],
    ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-100">GST report</h3>
          <p className="text-xs text-slate-400">Confirmed orders only (cancelled, returned and refunded orders are left out). Share the CSV with your accountant.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="p-2 text-xs bg-obsidian-950 border border-slate-800 rounded text-slate-100 outline-none">
            <option value="all">All time</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button onClick={exportCsv} className={`${btnGhost} flex items-center gap-1`}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ['Taxable value', totals.taxable],
          ['GST collected', totals.gst],
          ['CGST', totals.cgst],
          ['SGST', totals.sgst],
          ['IGST', totals.igst],
        ].map(([label, value]) => (
          <div key={label as string} className={`${card} p-3`}>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">{label}</span>
            <div className="font-mono font-bold text-gold-300">{inr(value as number)}</div>
          </div>
        ))}
      </div>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-xs text-slate-300 font-mono">
          <thead className="bg-obsidian-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3 text-left">Invoice</th>
              <th className="p-3 text-left">State</th>
              <th className="p-3 text-right">Taxable</th>
              <th className="p-3 text-right">GST</th>
              <th className="p-3 text-right">CGST</th>
              <th className="p-3 text-right">SGST</th>
              <th className="p-3 text-right">IGST</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-slate-800/60">
                <td className="p-3 text-gold-300 font-bold">{o.id}</td>
                <td className="p-3 font-sans">{o.state}</td>
                <td className="p-3 text-right">{inr(o.taxableAmount)}</td>
                <td className="p-3 text-right text-emerald-400">{inr(o.gstAmount)}</td>
                <td className="p-3 text-right">{inr(o.cgst)}</td>
                <td className="p-3 text-right">{inr(o.sgst)}</td>
                <td className="p-3 text-right">{inr(o.igst)}</td>
                <td className="p-3 text-right font-bold">{inr(o.totalAmount)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-slate-500 font-sans">No confirmed orders in this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
