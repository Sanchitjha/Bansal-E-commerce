'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2, Upload } from 'lucide-react';
import { useLuminary } from '@/context/LuminaryContext';
import { CreatorVideo } from '@/types';
import { btnGhost, btnGold, card, errText, errorBox, inputCls, labelCls } from '../ui';
import { uploadImage, uploadVideo, useUploadEnabled } from '../upload';

type Draft = CreatorVideo;

const blank = (priority: number): Draft => ({
  id: `new-${Date.now()}-${priority}`,
  title: '',
  creator: '',
  videoUrl: '',
  posterUrl: '',
  productId: undefined,
  priority,
  isActive: true,
});

export const VideosTab: React.FC = () => {
  const { adminCreatorVideos, updateCreatorVideos, adminProducts, showToast } = useLuminary();
  const uploadEnabled = useUploadEnabled();

  const [videos, setVideos] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    setVideos(adminCreatorVideos.map((v) => ({ ...v })));
  }, [adminCreatorVideos]);

  const dirty = JSON.stringify(videos.map(({ id, ...rest }) => rest)) !== JSON.stringify(adminCreatorVideos.map(({ id, ...rest }) => rest));

  const patch = (i: number, change: Partial<Draft>) => setVideos((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...change } : v)));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...videos];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setVideos(next);
  };

  const upload = async (i: number, kind: 'video' | 'image', file: File) => {
    setError(null);
    setUploading(`${i}-${kind}`);
    try {
      if (kind === 'video') patch(i, { videoUrl: await uploadVideo(file) });
      else patch(i, { posterUrl: await uploadImage(file) });
    } catch (err) {
      setError(errText(err));
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setError(null);
    for (const v of videos) {
      if (!v.title.trim() || !v.videoUrl.trim()) return setError('Every video needs a title and a video.');
    }
    setSaving(true);
    try {
      await updateCreatorVideos(
        videos.map((v, i) => ({
          ...v,
          title: v.title.trim(),
          creator: v.creator.trim(),
          videoUrl: v.videoUrl.trim(),
          posterUrl: v.posterUrl.trim(),
          productId: v.productId || undefined,
          priority: i + 1,
        }))
      );
      showToast('Creator videos saved', 'success');
    } catch (err) {
      setError(errText(err));
    } finally {
      setSaving(false);
    }
  };

  const visible = videos.filter((v) => v.isActive).length;

  return (
    <div className="space-y-6">
      <section className={`${card} p-5 space-y-4 border-gold-500/20`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-bold text-gold-400">Recommended by your favourite creators</h3>
            <p className="text-xs text-slate-400 mt-1">
              Videos shown under the blog section of the home page. Use the eye button to hide a video without deleting it. When every video is hidden, the whole section disappears from the website.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {videos.length === 0 ? 'No videos yet.' : `${visible} of ${videos.length} visible on the website.`}
              {!uploadEnabled && ' (Video upload is not connected, so paste a link to a video file instead.)'}
            </p>
          </div>
          <button onClick={() => setVideos([...videos, blank(videos.length + 1)])} className={`${btnGhost} flex items-center gap-1 shrink-0`}>
            <Plus className="w-3.5 h-3.5" /> Add video
          </button>
        </div>

        <div className="space-y-4">
          {videos.map((v, i) => (
            <div key={v.id} className={`rounded-xl bg-obsidian-900 border p-4 space-y-3 ${v.isActive ? 'border-slate-800' : 'border-slate-800 opacity-60'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gold-300">
                  Video {i + 1} {!v.isActive && <span className="ml-2 text-slate-400 font-semibold">(hidden)</span>}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => patch(i, { isActive: !v.isActive })}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-bold ${v.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}
                    aria-pressed={v.isActive}
                    title={v.isActive ? 'Visible: click to hide' : 'Hidden: click to show'}
                  >
                    {v.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {v.isActive ? 'Visible' : 'Hidden'}
                  </button>
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-30" aria-label="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === videos.length - 1} className="p-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-30" aria-label="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setVideos(videos.filter((_, idx) => idx !== i))} className="p-1.5 rounded bg-slate-800 text-rose-400" aria-label="Delete video"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Title *</label>
                  <input className={inputCls} value={v.title} onChange={(e) => patch(i, { title: e.target.value })} placeholder="e.g. My honest review of Pure Extract" />
                </div>
                <div>
                  <label className={labelCls}>Creator name</label>
                  <input className={inputCls} value={v.creator} onChange={(e) => patch(i, { creator: e.target.value })} placeholder="e.g. @creatorname" />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Video *</label>
                  <div className="flex items-center gap-2">
                    <input className={inputCls} value={v.videoUrl} onChange={(e) => patch(i, { videoUrl: e.target.value })} placeholder="https://… link to an MP4 video" />
                    {uploadEnabled && (
                      <label className="shrink-0 cursor-pointer px-2.5 py-2 rounded bg-obsidian-950 border border-slate-700 text-gold-300" title="Upload video (up to 100 MB)">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (file) upload(i, 'video', file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {uploading === `${i}-video` && <p className="text-[11px] text-slate-400 mt-1">Uploading video… this can take a minute.</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Cover picture (optional)</label>
                  <div className="flex items-center gap-2">
                    {v.posterUrl && <img src={v.posterUrl} alt="" className="w-8 h-10 rounded object-cover border border-slate-800 shrink-0" />}
                    <input className={inputCls} value={v.posterUrl} onChange={(e) => patch(i, { posterUrl: e.target.value })} placeholder="Leave empty to use a frame from the video" />
                    {uploadEnabled && (
                      <label className="shrink-0 cursor-pointer px-2.5 py-2 rounded bg-obsidian-950 border border-slate-700 text-gold-300" title="Upload cover picture">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (file) upload(i, 'image', file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {uploading === `${i}-image` && <p className="text-[11px] text-slate-400 mt-1">Uploading…</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Product shown with this video (optional)</label>
                  <select className={inputCls} value={v.productId ?? ''} onChange={(e) => patch(i, { productId: e.target.value || undefined })}>
                    <option value="">None</option>
                    {adminProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Adds a "Shop this" button when the video is played.</p>
                </div>
              </div>
            </div>
          ))}
          {videos.length === 0 && <p className="text-xs text-slate-500">Nothing here yet. Click "Add video" to add the first one.</p>}
        </div>

        {error && <p className={errorBox}>{error}</p>}
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving || (!dirty && videos.length > 0)} className={btnGold}>
            {saving ? 'Saving…' : 'Save videos'}
          </button>
          {dirty && <span className="text-[11px] text-amber-300">You have unsaved changes.</span>}
        </div>
      </section>
    </div>
  );
};
