import React from 'react';

const POSTS = [
  {
    tag: 'Fragrance',
    title: 'How to Make Your Perfume Last All Day',
    excerpt: 'Simple layering and application tricks that keep your favourite scent fresh from morning to night.',
    image: 'https://images.unsplash.com/photo-1733660227163-01bc46e0d7d7?auto=format&fit=crop&w=600&q=80',
  },
  {
    tag: 'Ayurveda',
    title: 'Kumkumadi Tailam: What It Does for Your Skin',
    excerpt: 'A closer look at the saffron-based facial oil and how to add it to your night routine.',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
  },
  {
    tag: 'Lifestyle',
    title: 'Choosing the Right Diffuser for Your Room',
    excerpt: 'Mist output, tank size and noise levels: what to check before you buy an aroma diffuser.',
    image: 'https://images.unsplash.com/photo-1732229035217-e7e42f61af4b?auto=format&fit=crop&w=600&q=80',
  },
  {
    tag: 'Ayurveda',
    title: 'A Gentle Seasonal Self-Care Routine',
    excerpt: 'Small daily habits inspired by Ayurveda to help you feel balanced as the seasons change.',
    image: 'https://images.unsplash.com/photo-1573575154488-f88a60e170df?auto=format&fit=crop&w=600&q=80',
  },
];

export const BlogSection: React.FC = () => (
  <section id="blog" className="scroll-mt-24 max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
    <div className="flex items-center gap-3 mb-6">
      <h2 className="text-3xl sm:text-4xl font-bold text-brand-green-800">Blogs</h2>
      <span className="px-3 py-1 rounded-full bg-brand-orange-500/10 text-brand-orange-600 text-xs font-bold">Trending</span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {POSTS.map((post) => (
        <article key={post.title} className="bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col">
          <div className="aspect-[16/10] bg-stone-100 overflow-hidden">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
          <div className="p-5 flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green-600">{post.tag}</span>
            <h3 className="text-[15px] font-semibold text-slate-900 leading-snug">{post.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
          </div>
        </article>
      ))}
    </div>
  </section>
);
