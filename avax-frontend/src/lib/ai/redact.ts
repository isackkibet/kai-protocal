/**
 * Pure helpers (no imports) so they run under `node --test`.
 */

const PRIVATE_KEY_RE = /\b(?:0x)?[0-9a-fA-F]{64}\b/g;
const SEED_KEYWORD_RE = /\b(seed|recovery|secret|backup)\s*(phrase|words?)\b|\bmnemonic\b|\bprivate\s*key\b/i;
// 12–24 short lowercase words in a row: the shape of a BIP-39 phrase. Only
// applied when the text also mentions a seed/recovery phrase, so ordinary
// lowercase speech (voice input) is never redacted.
const MNEMONIC_RUN_RE = /\b(?:[a-z]{3,8}[\s,]+){11,23}[a-z]{3,8}\b/g;

/**
 * Removes private keys and seed phrases before text is sent to any AI
 * provider. People do paste them ("here is my seed phrase, restore my
 * wallet"); they must not end up in Gemini / Groq / NVIDIA logs.
 */
export function redactSecrets(text: string): string {
  let out = text.replace(PRIVATE_KEY_RE, '[redacted private key]');
  if (SEED_KEYWORD_RE.test(out)) {
    out = out.replace(MNEMONIC_RUN_RE, '[redacted seed phrase]');
    // "my seed phrase: apple banana cherry…" — a shorter paste after an
    // explicit ":" / "=" / " is ", when what follows is a list of plain
    // words. "what is a seed phrase and why…" has no separator, so it stays.
    out = out.replace(
      /((?:seed|recovery|secret|backup)\s*(?:phrase|words?)|mnemonic)(\s*(?::|=|\bis\b|\bare\b)\s*)((?:[a-z]{3,8}[\s,]+){3,}[a-z]{3,8})/gi,
      (_m, kw) => `${kw}: [redacted seed phrase]`,
    );
  }
  return out;
}

