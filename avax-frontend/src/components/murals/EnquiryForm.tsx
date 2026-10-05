'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

/** "I want this mural": name + phone or email; the CFA team follows up. */
export default function EnquiryForm({ slug, title }: { slug: string; title: string }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const send = async () => {
    setState('sending'); setError('');
    try {
      const res = await fetch(`/api/murals/${slug}/enquiry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, email, message }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setState('error'); setError(d.error ?? 'Could not send. Please try again.'); return; }
      setState('sent');
    } catch {
      setState('error'); setError('Network problem. Please try again.');
    }
  };

  if (state === 'sent') return <p className="mv-ok"><Check size={16} /> Thank you, {name}. We will contact you about “{title}” soon.</p>;
  return (
    <div className="mv-form">
      <label><span>Your name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
      <label><span>Phone (M-Pesa number is fine)</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="07…" /></label>
      <label><span>Email (optional)</span><input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoComplete="email" /></label>
      <label><span>Message (optional)</span><textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Size, delivery, or a portrait you would like" /></label>
      {state === 'error' && <p className="mv-err">{error}</p>}
      <button className="mv-btn" onClick={() => void send()} disabled={state === 'sending'}>
        {state === 'sending' ? <><Loader2 size={15} className="mv-spin" /> Sending…</> : 'Send my request'}
      </button>
    </div>
  );
}
