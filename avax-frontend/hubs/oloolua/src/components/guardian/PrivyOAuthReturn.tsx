'use client';

import { useEffect } from 'react';

/**
 * Mounted in the root layout, and deliberately free of Privy imports so the
 * public pages do not load the Privy SDK. If Privy's Google redirect returns
 * to a page other than the Guardian Hub, forward it there with its
 * parameters so the Hub's Privy provider can finish the sign-in.
 */
export default function PrivyOAuthReturn() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('privy_oauth_code') && window.location.pathname !== '/portal') {
      window.location.replace(`/portal${window.location.search}`);
    }
  }, []);
  return null;
}
