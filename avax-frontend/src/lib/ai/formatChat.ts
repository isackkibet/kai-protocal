const CODE_STYLE =
  'background:rgba(16,185,129,0.15);padding:1px 5px;border-radius:4px;font-size:11.5px;font-family:var(--font-mono),monospace;color:#86efac';

const TOKEN_TERMS = [
  'yBOB', 'YTOKEN', 'YGOLD', 'YToken', 'YGold', 'WAVAX', 'sAVAX', 'wAVAX',
  'NVR', 'GAMI', 'CENTS', 'AVAX', 'USDT', 'USDC', 'BOB',
];

const KEY_TERMS = [
  'APY', 'APR', 'TVL', 'RAG', 'DID', 'DAO', 'NFT', 'DeFi', 'x402', 'M-Pesa',
  'Avalanche', 'vault', 'yield', 'liquidity',
];

const TERMS = [...TOKEN_TERMS, ...KEY_TERMS];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* Bold/code/number highlighting for a single line — no block-level markup
   here, that's handled by formatChat so list markers don't get swallowed. */
function highlightInline(text: string): string {
  let html = escapeHtml(text);

  html = html.replace(/`([^`]+)`/g, (_, code: string) => `<code style="${CODE_STYLE}">${code}</code>`);

  html = html.replace(/\*\*([^*]+)\*\*/g, (_, strong: string) => `<strong>${strong}</strong>`);

  html = html.replace(/(\b\d[\d,]*(?:\.\d+)?%)(?![\w])/g, '<strong>$1</strong>');

  html = html.replace(/(\$\s?\d[\d,]*(?:\.\d+)?)/g, (_, amount: string) => `<strong>${amount}</strong>`);

  for (const term of TERMS) {
    html = html.replace(
      new RegExp(`(?<![\\w&;])${escapeRegExp(term)}(?![\\w])`, 'g'),
      (m: string) => `<strong>${m}</strong>`
    );
  }

  return html;
}

const BULLET_RE  = /^[*-]\s+(.*)/;
const ORDERED_RE = /^\d+\.\s+(.*)/;

/* Turns markdown-ish agent replies (bullet/numbered lists, blank-line
   paragraphs, **bold**) into real HTML instead of joining every line with
   <br/> — a "* **GAMI Vault** ..." line was rendering as a literal asterisk
   followed by bold text rather than an actual list item. */
export function formatChat(text: string): string {
  const lines = text.split('\n');
  let html = '';
  let listTag: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listTag) { html += `</${listTag}>`; listTag = null; }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }

    const bullet = BULLET_RE.exec(line);
    const ordered = ORDERED_RE.exec(line);

    if (bullet) {
      if (listTag !== 'ul') { closeList(); html += '<ul style="margin:6px 0 10px;padding-left:18px;">'; listTag = 'ul'; }
      html += `<li style="margin:4px 0;">${highlightInline(bullet[1])}</li>`;
    } else if (ordered) {
      if (listTag !== 'ol') { closeList(); html += '<ol style="margin:6px 0 10px;padding-left:20px;">'; listTag = 'ol'; }
      html += `<li style="margin:4px 0;">${highlightInline(ordered[1])}</li>`;
    } else {
      closeList();
      html += `<p style="margin:0 0 8px;">${highlightInline(line)}</p>`;
    }
  }
  closeList();

  return html;
}
