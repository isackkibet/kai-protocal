import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, Fingerprint, ImageIcon, ShieldAlert, ShieldCheck, Sprout, Users } from 'lucide-react';
import { getPrisma } from '@/lib/db/db';
import { getMuralDetail } from '@/lib/murals/store';
import BuyBox from '@/components/murals/BuyBox';
import { muralCheckoutEnabled } from '@/lib/murals/checkout';

/**
 * /murals/:slug — one mural and its provenance: the CFA, who planted, the
 * verified records behind it (with verifier and Avalanche timestamp), and a
 * provenance fingerprint recomputed from today's records.
 */

export const dynamic = 'force-dynamic';

const C = {
  bg: '#0E2418', band: '#12301F', card: '#15352A', line: 'rgba(246,242,231,0.08)',
  paper: '#F6F2E7', dim: '#C9CFC2', ink: '#9BA396', gold: '#C89B3C', goldLight: '#E4C878', green: '#7DC383', red: '#E88C7D', amber: '#E8B04B',
};
const EXPLORER = 'https://testnet.snowtrace.io';
const day = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

async function load(slug: string) {
  const prisma = await getPrisma();
  return prisma ? getMuralDetail(prisma, slug) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = await load((await params).slug);
  return m ? { title: `${m.title} by ${m.artist} | KAI Murals`, description: `A conservation mural with a verified story from ${m.cfa.name}.` } : { title: 'Mural not found' };
}

export default async function MuralPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ reference?: string }> }) {
  const m = await load((await params).slug);
  const ref = (await searchParams).reference;
  const returnedReference = typeof ref === 'string' && /^kai_mural_[a-f0-9]{20}$/.test(ref) ? ref : null;
  if (!m) notFound();
  const anchored = m.records.filter((r) => r.anchorStatus === 'ANCHORED').length;

  return (
    <main className="mv">
      <header className="mv-top">
        <div className="mv-wrap mv-top-inner">
          <Link href="/murals" className="mv-back" aria-label="All murals"><ArrowLeft size={18} /></Link>
          <div><h1 className="mv-title">{m.title}</h1><p className="mv-sub">by {m.artist}</p></div>
        </div>
      </header>

      <div className="mv-wrap mv-body">
        <section className="mv-hero">
          <div className="mv-pic">{m.hasImage ? <img src={`/api/murals/${m.slug}/image`} alt={m.title} /> : <ImageIcon size={40} />}</div>
          <div className="mv-info">
            <p className="mv-eyebrow">{m.cfa.name}</p>
            <h2>{m.title}</h2>
            <p className="mv-by">by {m.artist}{m.sizeLabel ? ` · ${m.sizeLabel}` : ''}</p>
            {m.description && <p className="mv-desc">{m.description}</p>}
            <p className="mv-price">KES {m.priceKes.toLocaleString()} <span>{m.status === 'available' ? 'Available' : m.status === 'reserved' ? 'Reserved' : m.status === 'sold' ? 'Sold' : 'Draft'}</span></p>
            <ul className="mv-facts">
              <li><Sprout size={15} /> {m.records.length} verified conservation record{m.records.length === 1 ? '' : 's'}</li>
              {m.planters.length > 0 && <li><Users size={15} /> Planted by {m.planters.join(', ')}</li>}
              <li><Fingerprint size={15} /> {anchored === m.records.length ? 'All records timestamped on Avalanche' : `${anchored} of ${m.records.length} timestamped on Avalanche so far`}</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="mv-h2">The story behind it</h2>
          <p className="mv-intro">The conservation work this mural is linked to. Each record was checked by a CFA verifier.</p>
          <ol className="mv-records">
            {m.records.map((r) => (
              <li key={r.id}>
                <b>{r.description}</b>
                <dl>
                  <dt>Community Forest Association</dt><dd>{m.cfa.name}</dd>
                  {r.submittedBy && <><dt>Recorded by</dt><dd>{r.submittedBy}, {day(r.recordedAt)}</dd></>}
                  <dt>Checked</dt><dd>{r.verificationStatus === 'VERIFIED' ? <span className="mv-good"><CheckCircle2 size={14} /> Verified{r.verifiedBy ? ` by ${r.verifiedBy}` : ''}{r.verifiedAt ? `, ${day(r.verifiedAt)}` : ''}</span> : r.verificationStatus.toLowerCase()}</dd>
                  <dt>Avalanche</dt><dd>{r.anchorStatus === 'ANCHORED' && r.avalancheTxHash
                    ? <a href={`${EXPLORER}/tx/${r.avalancheTxHash}`} target="_blank" rel="noopener noreferrer">Timestamped {r.anchoredAt ? day(r.anchoredAt) : ''} <ExternalLink size={12} /></a>
                    : <span className="mv-wait"><Clock size={14} /> Waiting for the next timestamp</span>}</dd>
                </dl>
                <Link href={`/verify/${r.id}`} className="mv-link" prefetch={false}>See the full proof <ExternalLink size={13} /></Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="mv-proof">
          <h2 className="mv-h2">Provenance fingerprint</h2>
          {m.provenance.matches ? (
            <p className="mv-good"><ShieldCheck size={16} /> Matches the records today. Nothing has changed since this mural was registered.</p>
          ) : (
            <p className="mv-bad"><ShieldAlert size={16} /> A linked record or the picture changed after this mural was registered. Ask the CFA before buying.</p>
          )}
          <code>{m.provenance.hash ?? m.provenance.current}</code>
          <p className="mv-small">SHA-256 of the mural (title, artist, picture fingerprint, CFA) and the fingerprints of the records above. Anyone with the same facts gets the same value.</p>
        </section>

        {(m.status !== 'sold' || returnedReference) && (
          <section className="mv-order">
            <h2 className="mv-h2">I want this mural</h2>
            {!returnedReference && <p className="mv-intro">{muralCheckoutEnabled() && m.status === 'available' ? 'Pay now with M-Pesa or card, or ask us first.' : 'Leave your details and we will call you about payment and delivery.'}</p>}
            <BuyBox slug={m.slug} title={m.title} priceKes={m.priceKes} checkoutEnabled={muralCheckoutEnabled() && m.status === 'available'} returnedReference={returnedReference} />
          </section>
        )}
      </div>

      <style>{`
        .mv { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .mv-wrap { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
        .mv-top { position: sticky; top: 0; z-index: 30; background: ${C.band}; border-bottom: 1px solid ${C.line}; }
        .mv-top-inner { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
        .mv-back { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: ${C.paper}; background: rgba(246,242,231,0.06); flex-shrink: 0; }
        .mv-title { margin: 0; font-size: 18px; font-weight: 700; }
        .mv-sub { margin: 1px 0 0; font-size: 12.5px; color: ${C.ink}; }
        .mv-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 32px; padding-top: 22px; }
        .mv-body > * { min-width: 0; }
        .mv-hero { display: grid; gap: 22px; grid-template-columns: 1fr; }
        @media (min-width: 860px) { .mv-hero { grid-template-columns: 1.2fr 1fr; align-items: start; } }
        .mv-pic { display: grid; place-items: center; aspect-ratio: 4 / 3; border-radius: 18px; overflow: hidden; background: ${C.band}; color: ${C.ink}; }
        .mv-pic img { width: 100%; height: 100%; object-fit: cover; }
        .mv-info { display: grid; gap: 8px; }
        .mv-eyebrow { margin: 0; font-size: 12.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: ${C.green}; }
        .mv-info h2 { margin: 0; font-size: clamp(26px, 4vw, 36px); }
        .mv-by { margin: 0; color: ${C.ink}; }
        .mv-desc { margin: 4px 0 0; color: ${C.dim}; line-height: 1.6; }
        .mv-price { margin: 8px 0 0; font-size: 26px; font-weight: 700; color: ${C.goldLight}; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .mv-price span { font-size: 13px; padding: 4px 10px; border-radius: 999px; background: rgba(125,195,131,0.16); color: ${C.green}; }
        .mv-facts { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; }
        .mv-facts li { display: flex; align-items: center; gap: 8px; color: ${C.dim}; font-size: 14.5px; }
        .mv-h2 { margin: 0 0 6px; font-size: 20px; }
        .mv-intro { margin: 0 0 14px; color: ${C.dim}; font-size: 15px; }
        .mv-records { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .mv-records li { padding: 18px; border-radius: 16px; background: ${C.card}; border-left: 3px solid ${C.green}; display: grid; gap: 10px; }
        .mv-records b { font-size: 16.5px; }
        .mv-records dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 0; font-size: 14px; }
        .mv-records dt { color: ${C.ink}; }
        .mv-records dd { margin: 0; }
        @media (max-width: 560px) { .mv-records dl { grid-template-columns: 1fr; gap: 2px; } .mv-records dd { margin-bottom: 8px; } }
        .mv-records a, .mv-link { color: ${C.goldLight}; display: inline-flex; align-items: center; gap: 5px; text-decoration: none; font-weight: 600; font-size: 14px; }
        .mv-good { display: inline-flex; align-items: center; gap: 6px; color: ${C.green}; margin: 0; }
        .mv-bad { display: inline-flex; align-items: center; gap: 6px; color: ${C.red}; margin: 0; }
        .mv-wait { display: inline-flex; align-items: center; gap: 6px; color: ${C.amber}; }
        .mv-proof { padding: 18px; border-radius: 16px; background: ${C.band}; display: grid; gap: 10px; }
        .mv-proof code { font-size: 13px; overflow-wrap: anywhere; color: ${C.goldLight}; }
        .mv-small { margin: 0; color: ${C.ink}; font-size: 13px; }
        .mv-order { padding: 18px; border-radius: 16px; background: ${C.band}; border: 1px solid rgba(200,155,60,0.3); }
        .mv-form { display: grid; gap: 12px; max-width: 520px; }
        .mv-form label { display: grid; gap: 6px; font-size: 13.5px; font-weight: 600; color: ${C.dim}; }
        .mv-form input, .mv-form textarea { box-sizing: border-box; width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(246,242,231,0.14); background: ${C.bg}; color: ${C.paper}; font-size: 15px; font-family: inherit; }
        .mv-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 13px 22px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 15px; cursor: pointer; font-family: inherit; width: fit-content; }
        .mv-btn:disabled { opacity: .6; }
        .mv-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 12px; background: ${C.bg}; margin-bottom: 14px; max-width: 520px; }
        .mv-tabs button { padding: 10px; border-radius: 9px; border: none; background: none; color: ${C.dim}; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit; }
        .mv-tabs button.on { background: ${C.gold}; color: #1B1A14; }
        .mv-linkbtn { border: none; background: none; padding: 0; color: ${C.goldLight}; font-weight: 600; cursor: pointer; font-family: inherit; text-decoration: underline; }
        .mv-err { display: flex; align-items: center; gap: 8px; }
        .mv-ok { display: flex; align-items: center; gap: 8px; color: ${C.green}; margin: 0; font-size: 15px; }
        .mv-err { margin: 0; color: ${C.red}; font-size: 14px; }
        .mv-spin { animation: mv-spin 1s linear infinite; }
        @keyframes mv-spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
