'use client';

import React from 'react';
import { useLuminary } from '@/context/LuminaryContext';
import { card } from '../ui';

const when = (ts: string) => new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const ActivityTab: React.FC = () => {
  const { activityLogs } = useLuminary();
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif text-lg font-bold text-slate-100">Activity log</h3>
        <p className="text-xs text-slate-400">Who changed what in the store, newest first</p>
      </div>
      <div className="space-y-2">
        {activityLogs.map((act) => (
          <div key={act.id} className={`${card} p-3 text-xs flex justify-between gap-3`}>
            <div className="min-w-0">
              <strong className="text-gold-400">{act.adminName}:</strong> <span className="text-slate-200">{act.action}</span>
              {act.details && <p className="text-[11px] text-slate-400 break-words">{act.details}</p>}
            </div>
            <span className="text-slate-500 font-mono text-[10px] shrink-0">{when(act.timestamp)}</span>
          </div>
        ))}
        {activityLogs.length === 0 && <p className="text-center text-sm text-slate-500 py-10">Nothing recorded yet.</p>}
      </div>
    </div>
  );
};

export const OrderLogTab: React.FC = () => {
  const { sheetSyncLogs } = useLuminary();
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif text-lg font-bold text-slate-100">Order log</h3>
        <p className="text-xs text-slate-400">A running record of order events. It is kept inside this store and is not connected to Google Sheets.</p>
      </div>
      <div className={`${card} p-4 space-y-2`}>
        {sheetSyncLogs.map((log) => (
          <div key={log.id} className="p-3 rounded-xl bg-obsidian-900 border border-slate-800/80 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-300 font-bold text-[10px] shrink-0">{log.sheetName}</span>
              <span className="text-slate-300 truncate">{log.event}</span>
            </div>
            <span className="text-slate-500 shrink-0">{when(log.timestamp)}</span>
          </div>
        ))}
        {sheetSyncLogs.length === 0 && <p className="text-center text-sm text-slate-500 py-6">No entries yet.</p>}
      </div>
    </div>
  );
};
