'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, X } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { optimizeImage, videoPoster } from '@/lib/media';
import type { CreatorVideo } from '@/types';

/** "Recommended by your favourite creators": short videos the store owner adds (and can hide) in the admin panel. */
export const CreatorVideos: React.FC = () => {
  const { creatorVideos, products } = useLuminary();
  const [playing, setPlaying] = useState<CreatorVideo | null>(null);

  const items = creatorVideos.filter((v) => v.isActive).sort((a, b) => a.priority - b.priority);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPlaying(null);
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [playing]);

  if (items.length === 0) return null;

  const coverFor = (video: CreatorVideo) => video.posterUrl || videoPoster(video.videoUrl, 600);
  const product = playing?.productId ? products.find((p) => p.id === playing.productId) : undefined;

  return (
    <section id="creators" className="scroll-mt-32 max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
      <h2 className="text-center text-2xl sm:text-3xl font-bold uppercase tracking-wide text-brand-green-900">Recommended by your favourite creators</h2>

      <div className="mt-8 flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 lg:justify-center">
        {items.map((video) => {
          const cover = coverFor(video);
          return (
            <button
              key={video.id}
              onClick={() => setPlaying(video)}
              className="group relative shrink-0 snap-start w-[68vw] sm:w-[300px] aspect-[3/4] overflow-hidden bg-black text-left"
              aria-label={`Play video: ${video.title}`}
            >
              {cover ? (
                <img src={optimizeImage(cover, 600)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              ) : (
                // No cover picture: show a still from the video itself.
                <video src={`${video.videoUrl}#t=1`} preload="metadata" muted playsInline className="absolute inset-0 w-full h-full object-cover" />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </span>
              <span className="absolute left-0 right-0 bottom-0 p-4 text-white">
                {video.creator && <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">{video.creator}</span>}
                <span className="block text-sm font-semibold leading-snug line-clamp-2 mt-0.5">{video.title}</span>
              </span>
            </button>
          );
        })}
      </div>

      {playing && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={playing.title}
          onClick={() => setPlaying(null)}
        >
          <div className="relative max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPlaying(null)}
              className="absolute -top-11 right-0 p-2 text-white hover:text-amber-300"
              aria-label="Close video"
            >
              <X className="w-7 h-7" />
            </button>
            <video
              key={playing.id}
              src={playing.videoUrl}
              poster={coverFor(playing) || undefined}
              controls
              autoPlay
              playsInline
              className="max-h-[78vh] max-w-[92vw] bg-black"
            />
            <div className="mt-3 flex items-center justify-between gap-4 text-white">
              <div className="min-w-0">
                {playing.creator && <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{playing.creator}</div>}
                <div className="text-sm font-semibold truncate">{playing.title}</div>
              </div>
              {product && (
                <Link
                  href={`/product/${product.urlSlug}`}
                  onClick={() => setPlaying(null)}
                  className="shrink-0 px-5 py-2.5 bg-white text-black text-[12px] font-semibold uppercase tracking-[0.14em] hover:bg-amber-200 transition"
                >
                  Shop this
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
