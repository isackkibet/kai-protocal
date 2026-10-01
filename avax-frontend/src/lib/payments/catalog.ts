/**
 * src/lib/payments/catalog.ts
 *
 * SERVER-SIDE product catalogue. This module is the pricing authority for
 * every chargeable good in the app.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * /api/paystack/initiate used to accept `priceUsd` straight from the request
 * body and bill exactly that. The browser sent the price from a catalogue
 * living in client JavaScript, which meant the customer chose the amount they
 * were charged. Combined with a client-supplied `reference`, that produced a
 * direct payment bypass:
 *
 *   1. POST /api/paystack/initiate { priceUsd: 0.01, reference: "<target>" }
 *   2. Pay the 1-kobo charge for real (a genuine, HMAC-signed Paystack event)
 *   3. The webhook matches on `reference` and marks the TARGET payment
 *      — created earlier at the real price — as "success".
 *
 * The webhook signature is genuinely valid in that scenario, so no signature
 * check would ever have caught it. The flaw was that the server had no
 * authoritative price of its own.
 *
 * Now the server resolves every price from this table and mints every
 * reference itself. A price sent by a client is only accepted for
 * transfer-style flows, where the amount genuinely is user-chosen, and even
 * then it is bounded and must be authenticated.
 *
 * Keep this file in sync with the display catalogue in app/connft/page.tsx.
 * The client copy is for presentation only — if they disagree, THIS one wins.
 */

export interface CatalogItem {
  /** Stable product id, e.g. "nft5". */
  id: string;
  name: string;
  /** Price in USD/yBOB. */
  priceUsd: number;
}

/** Priced goods. Anything not in here cannot be purchased. */
export const CATALOG: Record<string, Omit<CatalogItem, 'id'>> = {
    nft1: { name: 'Leopard Lookout', priceUsd: 85 },
    nft2: { name: 'Jaguar\'s Roar', priceUsd: 250 },
    nft3: { name: 'Osprey Sentinel', priceUsd: 120 },
    nft4: { name: 'Savanna Trio', priceUsd: 180 },
    nft5: { name: 'Ghost Bird', priceUsd: 300 },
    nft6: { name: 'Lilac Roller', priceUsd: 95 },
    nft7: { name: 'Nilgai Guardian', priceUsd: 145 },
    nft8: { name: 'Langur Elder', priceUsd: 210 },
    nft9: { name: 'African Twilight', priceUsd: 350 },
    nft10: { name: 'Giraffe at Dusk', priceUsd: 175 },
    nft11: { name: 'Elephant in Mist', priceUsd: 420 },
    nft12: { name: 'Wetland Watcher', priceUsd: 78 },
    nft13: { name: 'Hornbill Portrait', priceUsd: 155 },
    nft14: { name: 'Raptor\'s Gaze', priceUsd: 198 },
    nft15: { name: 'Eagle Hunter', priceUsd: 225 },
    nft16: { name: 'Forest Canopy', priceUsd: 110 },
    nft17: { name: 'Kingfisher Dive', priceUsd: 88 },
    nft18: { name: 'Tiger Eyes', priceUsd: 475 },
    nft19: { name: 'Flamingo Flock', priceUsd: 135 },
    nft20: { name: 'Leopard at Rest', priceUsd: 310 },
    nft21: { name: 'Monkey Kingdom', priceUsd: 165 },
    nft22: { name: 'Riverine Dawn', priceUsd: 72 },
    nft23: { name: 'Wild Stallion', priceUsd: 280 },
    nft24: { name: 'Parrot Paradise', priceUsd: 92 },
    nft25: { name: 'Coral Gardens', priceUsd: 195 },
    nft26: { name: 'Bison Stampede', priceUsd: 340 },
    nft27: { name: 'Elephant Matriarch', priceUsd: 390 },
    nft28: { name: 'Tusk Guardian', priceUsd: 415 },
    nft29: { name: 'Crane Dance', priceUsd: 128 },
    nft30: { name: 'Elephant Caravan', priceUsd: 500 },
    nft40: { name: 'Rhino Charge', priceUsd: 480 },
    nft46: { name: 'Lion\'s Pride', priceUsd: 550 },
    nft50: { name: 'Cheetah Sprint', priceUsd: 395 },
    nft68: { name: 'Sea Turtle', priceUsd: 310 },
    nft69: { name: 'Whale Breach', priceUsd: 425 },
    nft75: { name: 'Snow Leopard', priceUsd: 490 },
    nft81: { name: 'Mountain Gorilla', priceUsd: 520 },
    nft100: { name: 'Sacred Grove', priceUsd: 400 },
    nft104: { name: 'Tiger Prowl', priceUsd: 510 },
};

// ── Bounds for transfer-style payments ───────────────────────────────────────

/**
 * A user-authorised transfer has no catalogue entry, so it is bounded instead.
 * Without these limits the endpoint is a laundering/money-mule primitive: an
 * attacker with one account could generate unlimited small inbound charges
 * that Paystack's fraud tooling will flag, or split a large payment to dodge
 * per-transaction review thresholds.
 */
export const TRANSFER_LIMITS_USD = {
  min: 0.5,
  max: 5_000,
} as const;

export function resolveCatalogItem(productId: string | undefined | null): CatalogItem | null {
  if (!productId) return null;
  const key = productId.trim();
  const item = CATALOG[key];
  if (!item) return null;
  return { id: key, ...item };
}

export function isValidTransferAmount(amountUsd: number): boolean {
  return (
    Number.isFinite(amountUsd) &&
    amountUsd >= TRANSFER_LIMITS_USD.min &&
    amountUsd <= TRANSFER_LIMITS_USD.max
  );
}

/** Allowed product/transfer ids — keeps the reference namespace predictable. */
export const REFERENCE_PATTERN = /^kai_[a-z0-9_]{4,64}$/;
