'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Check, Star, Trash2 } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { ReviewItem } from '@/types';
import { btnGhost, card, errText, errorBox } from '../ui';

export const ReviewsTab: React.FC = () => {
  const { adminProducts, showToast } = useLuminary();
  const [reviews, setReviews] = useState<ReviewItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews?status=all');
      if (!res.ok) throw new Error('Could not load reviews.');
      setReviews(await res.json());
    } catch (err) {
      setError(errText(err));
      setReviews([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, kind: 'approve' | 'delete') => {
    if (kind === 'delete' && !window.confirm('Delete this review for good?')) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: kind === 'approve' ? 'PATCH' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: kind === 'approve' ? JSON.stringify({ status: 'approved' }) : undefined,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'That did not work.');
      showToast(kind === 'approve' ? 'Review approved and published' : 'Review deleted', 'success');
      await load();
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusyId(null);
    }
  };

  const productName = (id: string) => adminProducts.find((p) => p.id === id)?.name ?? 'Unknown product';
  const pending = (reviews ?? []).filter((r) => r.status === 'pending');
  const published = (reviews ?? []).filter((r) => r.status !== 'pending');

  const row = (review: ReviewItem, isPending: boolean) => (
    <div key={review.id} className="rounded-xl bg-obsidian-900 border border-slate-800 p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-current' : 'text-slate-700'}`} />
              ))}
            </span>
            <span className="font-bold text-slate-100">{review.title}</span>
            {review.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded px-1.5 py-0.5">
                <BadgeCheck className="w-3 h-3" /> Verified buyer{review.orderId ? ` · ${review.orderId}` : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{review.content}</p>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {review.author}
            {review.location ? `, ${review.location}` : ''} · {productName(review.productId)} · {new Date(review.date).toLocaleDateString('en-IN')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isPending && (
            <button onClick={() => act(review.id, 'approve')} disabled={busyId === review.id} className={`${btnGhost} flex items-center gap-1 text-emerald-300`}>
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
          )}
          <button onClick={() => act(review.id, 'delete')} disabled={busyId === review.id} className={`${btnGhost} flex items-center gap-1 text-rose-400`}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className={`${card} p-5 space-y-3 border-gold-500/20`}>
        <div>
          <h3 className="font-serif text-base font-bold text-gold-400">Waiting for your approval ({pending.length})</h3>
          <p className="text-xs text-slate-400 mt-1">
            Reviews from people who did not enter a matching order ID and phone number. They stay hidden, and do not change the star rating, until you approve them.
          </p>
        </div>
        {reviews === null && <p className="text-xs text-slate-500">Loading…</p>}
        {reviews !== null && pending.length === 0 && <p className="text-xs text-slate-500">Nothing waiting.</p>}
        {pending.map((r) => row(r, true))}
      </section>

      <section className={`${card} p-5 space-y-3 border-gold-500/20`}>
        <div>
          <h3 className="font-serif text-base font-bold text-gold-400">Published reviews ({published.length})</h3>
          <p className="text-xs text-slate-400 mt-1">A badge marks reviews matched to a real order. Delete spam or abuse here.</p>
        </div>
        {reviews !== null && published.length === 0 && <p className="text-xs text-slate-500">No published reviews yet.</p>}
        {published.map((r) => row(r, false))}
      </section>

      {error && <p className={errorBox}>{error}</p>}
    </div>
  );
};
