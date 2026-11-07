import type { CSSProperties, ElementType, ReactNode } from 'react';
import { Check, ChevronRight, Clock, CreditCard, Heart, MessageCircle, Package, Palette, Ruler, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react';
import type { CustomSection, FaqSection, HowSection, IconKey, SectionImage } from '@/lib/sections';
import { fillTokens } from '@/lib/sections';
import { waLink } from '@/lib/wa';
import type { SiteSettings } from '@/lib/types';

const ICON_MAP: Record<Exclude<IconKey, 'none'>, typeof Package> = {
  package: Package, palette: Palette, truck: Truck, message: MessageCircle, shield: ShieldCheck, sparkles: Sparkles,
  clock: Clock, heart: Heart, star: Star, card: CreditCard, ruler: Ruler,
};
export function SectionIcon({ name, size = 40 }: { name: IconKey; size?: number }) {
  if (name === 'none') return null;
  const I = ICON_MAP[name];
  return I ? <I size={size} strokeWidth={1.5} aria-hidden="true" /> : null;
}

/**
 * Foto + konten dengan tata letak yang bisa diatur admin (atas / bawah / kiri / kanan, ukuran, rasio, fit).
 * Posisi kiri/kanan otomatis menumpuk ke atas/bawah kalau tempatnya sempit (pakai container query,
 * jadi kartu kecil di HP tetap rapi dan pratinjau di admin akurat).
 */
export function MediaLayout({ image, as: Tag = 'div', className = '', align = 'start', children }: {
  image?: SectionImage | null; as?: ElementType; className?: string; align?: 'start' | 'center'; children: ReactNode;
}) {
  const has = !!image?.url;
  return (
    <Tag className={`mlwrap ${has ? 'has-media' : ''} ${className}`.trim()}>
      <div className={`ml${has ? ` pos-${image!.pos}` : ''}${align === 'center' ? ' ml-center' : ''}`} data-size={has ? image!.size : undefined}>
        {has && (
          <figure className="mlfig" data-ratio={image!.ratio} data-fit={image!.fit}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image!.url} alt={image!.alt} loading="lazy" decoding="async" />
          </figure>
        )}
        <div className="mlbody">{children}</div>
      </div>
    </Tag>
  );
}

const isExternal = (u: string) => /^https?:\/\//i.test(u);
const cols = (n: number) => ({ '--cols': n }) as CSSProperties;

export function HowtoSection({ s }: { s: HowSection }) {
  return (
    <section id="carapesan" className="section howto" aria-labelledby="howto-title">
      <div className="container">
        <MediaLayout image={s.image} align="center" className="secml">
          {(s.title || s.subtitle) && (
            <div className="howhead">
              {s.title && <h2 id="howto-title">{s.title}</h2>}
              {s.subtitle && <p>{s.subtitle}</p>}
            </div>
          )}
          <div className="howcards" data-cols={s.columns} style={cols(s.columns)}>
            {s.cards.map((c, i) => (
              <MediaLayout key={i} as="article" image={c.image} className="howcard">
                <SectionIcon name={c.icon} />
                {c.title && <h3>{c.title}</h3>}
                {c.text && <p>{c.text}</p>}
                {c.link_label && c.link_url && (
                  <a href={c.link_url} {...(isExternal(c.link_url) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{c.link_label} <ChevronRight size={16} /></a>
                )}
              </MediaLayout>
            ))}
          </div>
        </MediaLayout>
      </div>
    </section>
  );
}

export function CustomSectionView({ s, settings }: { s: CustomSection; settings: Parameters<typeof waLink>[0] }) {
  return (
    <section id="custom" className="custom" aria-labelledby="custom-title">
      <div className="container">
        <MediaLayout image={s.image} align="center" className="secml">
          <div className="cz">
            <div className="czhead customhead">
              {s.title && <h2 id="custom-title">{s.title}</h2>}
              {s.text && <p>{s.text}</p>}
              {s.checks.length > 0 && <ul className="checks">{s.checks.map(t => <li key={t}><Check size={16} />{t}</li>)}</ul>}
              <a className="primary czcta" href={waLink(settings)} target="_blank" rel="noopener noreferrer">Konsultasi custom via WhatsApp <MessageCircle size={18} /></a>
            </div>
            {s.steps.length > 0 && (
              <ol className="steps czsteps">
                {s.steps.map((st, i) => (
                  <MediaLayout key={i} as="li" image={st.image} className="step">
                    <div className="czrow">
                      <span className="stepnum">{i + 1}</span>
                      <div className="czbody">
                        {st.title && <b>{st.title}</b>}
                        {st.text && <span className="steptext">{st.text}</span>}
                      </div>
                    </div>
                  </MediaLayout>
                ))}
              </ol>
            )}
          </div>
        </MediaLayout>
      </div>
    </section>
  );
}

export function FaqSectionView({ s, settings }: { s: FaqSection; settings: Pick<SiteSettings, 'payment_info'> }) {
  return (
    <section id="faq" className="section faq" aria-labelledby="faq-title">
      <div className="container">
        <MediaLayout image={s.image} align="center" className="secml">
          <div className="faqgrid">
            {(s.title || s.subtitle) && (
              <div className="faqhead">
                {s.title && <h2 id="faq-title">{s.title}</h2>}
                {s.subtitle && <p>{s.subtitle}</p>}
              </div>
            )}
            <div className="faqlist">
              {s.items.map((f, i) => (
                <details key={i} open={s.open_first && i === 0 ? true : undefined}>
                  <summary>{f.q}</summary>
                  <MediaLayout image={f.image} className="faqans">
                    {f.a && <p>{fillTokens(f.a, settings)}</p>}
                  </MediaLayout>
                </details>
              ))}
            </div>
          </div>
        </MediaLayout>
      </div>
    </section>
  );
}
