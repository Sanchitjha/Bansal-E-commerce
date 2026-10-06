import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/data';
import { DEFAULT_SETTINGS } from '@/lib/default-settings';
import { POLICY_LINKS, POLICY_SLUGS, POLICY_UPDATED, getPolicy } from '@/lib/policies';

export const revalidate = 300;

export function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { settings } = await getCatalog();
  const policy = getPolicy(params.slug, settings ?? DEFAULT_SETTINGS);
  if (!policy) return { title: 'Page not found' };
  return { title: policy.title, description: policy.description, alternates: { canonical: `/policies/${params.slug}` } };
}

export default async function PolicyPage({ params }: { params: { slug: string } }) {
  const { settings } = await getCatalog();
  const policy = getPolicy(params.slug, settings ?? DEFAULT_SETTINGS);
  if (!policy) notFound();

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-[220px_1fr] gap-8">
      <nav aria-label="Policies" className="md:sticky md:top-28 self-start">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Policies</h2>
        <ul className="space-y-1">
          {POLICY_LINKS.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/policies/${l.slug}`}
                className={`block px-3 py-2 rounded-xl text-sm ${l.slug === params.slug ? 'bg-brand-green-700 text-white font-semibold' : 'text-slate-700 hover:bg-white'}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <article className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10">
        <h1 className="text-3xl font-bold text-brand-green-800">{policy.title}</h1>
        <p className="text-xs text-slate-500 mt-1 mb-6">Last updated: {POLICY_UPDATED}</p>

        <div className="space-y-6">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-slate-900 mb-2">{section.heading}</h2>
              {section.paragraphs?.map((p) => (
                <p key={p} className="text-sm text-slate-600 leading-relaxed mb-2">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600 leading-relaxed">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
