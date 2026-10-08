'use client';

import { useState, type FormEvent } from 'react';

export type MessageKind = 'contact' | 'commitment' | 'pledge' | 'newsletter';
export type FormStatus = 'idle' | 'sending' | 'success' | 'error';

/**
 * Submits an uncontrolled form to /api/messages. Inputs are read by their
 * `name` attribute (name, contact, message, and the hidden `website`
 * honeypot), so forms stay plain HTML with no per-field state.
 */
export function useMessageForm(kind: MessageKind) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [feedback, setFeedback] = useState('');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'sending') return;

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus('sending');
    setFeedback('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, kind }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setStatus('error');
        setFeedback(
          res.status === 429
            ? 'Too many submissions. Please wait a minute and try again.'
            : json.error || 'Something went wrong. Please try again.',
        );
        return;
      }
      form.reset();
      setStatus('success');
      setFeedback(json.message || 'Thank you.');
    } catch {
      setStatus('error');
      setFeedback('Could not reach the server. Check your connection and try again.');
    }
  };

  return { status, feedback, onSubmit, reset: () => setStatus('idle') };
}
