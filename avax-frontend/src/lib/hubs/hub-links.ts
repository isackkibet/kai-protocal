/**
 * The original Oloolua Youth Guardians website, kept exactly as its makers
 * designed it and hosted on its own. The Information Hub links open it.
 * Must match OLOOLUA_URL in next.config.ts.
 */
const env = process.env.NEXT_PUBLIC_OLOOLUA_PORTAL_URL;
export const OLOOLUA_SITE_URL = (env && /^https:\/\//.test(env) ? env : 'https://oloolua-youth-guardians.vercel.app').replace(/\/+$/, '');
