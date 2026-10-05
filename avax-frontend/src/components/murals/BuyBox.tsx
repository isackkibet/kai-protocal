'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Loader2, ShieldAlert } from 'lucide-react';
import EnquiryForm from './EnquiryForm';

/**
 * Buying a mural: "Pay now" (Paystack: M-Pesa or card, price from the
 * server) or "Ask us first" (leave a phone number). When the buyer comes
 * back from Paystack (?reference=…), the payment is checked and settled.
 */
export default function BuyBox({ slug, title, priceKes, checkoutEnabled, returnedReference }: {
  slug: string; title: string; priceKes: number; checkoutEnabled: boolean; returnedReference: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'pay' | 'ask'>(checkoutEnabled ? 'pay' : 'ask');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<'checking' | 'paid' | 'pending' | 'failed' | 'conflict' | null>(returnedReference ? 'checking' : null);

  // Back from Paystack: check the payment (a few tries while M-Pesa confirms).
  useEffect(() => {
    if (!returnedReference) return;
    let on = true;
    let tries = 0;
    const check = () => {
      fetch(`/api/murals/${slug}/checkout?reference=${encodeURIComponent(returnedReference)}`).then((r) => r.json()).then((d) => {
        if (!on) return;
        const state = d?.state as string;
        if (state === 'paid' || state === 'conflict' || state === 'failed') { setResult(state); if (state === 'paid') router.refresh(); return; }
        if (++tries < 6) setTimeout(check, 5000); else setResult('pending');
      }).catch(() => { if (on) setResult('pending'); });
    };
    check();
    return () => { on = false; };
  }, [returnedReference, slug, router]);

  const pay = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/murals/${slug}/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.authorizationUrl) { setError(d.error ?? 'Could not start the payment. Please try again.'); setBusy(false); return; }
      window.location.assign(d.authorizationUrl); // Paystack's page
    } catch {
      setError('Network problem. Please try again.'); setBusy(false);
    }
  };

  if (result) {
    return result === 'checking' ? <p className="mv-wait"><Loader2 size={16} className="mv-spin" /> Checking your payment…</p>
      : result === 'paid' ? <p className="mv-ok"><CheckCircle2 size={16} /> Payment received. Thank you! We will call you to arrange delivery of “{title}”.</p>
      : result === 'conflict' ? <p className="mv-err"><ShieldAlert size={16} /> Your payment arrived, but this mural was just sold to someone else. We will call you to refund or offer another mural.</p>
      : result === 'failed' ? <p className="mv-err">The payment did not go through. Nothing was charged. <button className="mv-linkbtn" onClick={() => setResult(null)}>Try again</button></p>
      : <p className="mv-wait"><Clock size={16} /> We are still waiting for the payment to confirm. If M-Pesa took the money, you will get a confirmation shortly; you can also refresh this page.</p>;
  }

  return (
    <div className="mv-buy">
      {checkoutEnabled && (
        <div className="mv-tabs" role="tablist">
          <button role="tab" aria-selected={mode === 'pay'} className={mode === 'pay' ? 'on' : ''} onClick={() => setMode('pay')}>Pay now</button>
          <button role="tab" aria-selected={mode === 'ask'} className={mode === 'ask' ? 'on' : ''} onClick={() => setMode('ask')}>Ask us first</button>
        </div>
      )}
      {mode === 'pay' && checkoutEnabled ? (
        <div className="mv-form">
          <p className="mv-intro" style={{ margin: 0 }}>Pay <b>KES {priceKes.toLocaleString()}</b> with M-Pesa or card on Paystack&apos;s secure page. We call you to arrange delivery.</p>
          <label><span>Your name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
          <label><span>Email (for the receipt)</span><input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoComplete="email" /></label>
          <label><span>Phone (for delivery)</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="07…" /></label>
          {error && <p className="mv-err">{error}</p>}
          <button className="mv-btn" onClick={() => void pay()} disabled={busy}>
            {busy ? <><Loader2 size={15} className="mv-spin" /> Opening Paystack…</> : `Pay KES ${priceKes.toLocaleString()}`}
          </button>
        </div>
      ) : (
        <EnquiryForm slug={slug} title={title} />
      )}
    </div>
  );
}
