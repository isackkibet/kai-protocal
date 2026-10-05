/**
 * The original Oloolua Youth Guardians website, kept exactly as its makers
 * designed it and hosted on its own. The Information Hub links open it.
 * Must match OLOOLUA_URL in next.config.ts.
 */
const env = process.env.NEXT_PUBLIC_OLOOLUA_PORTAL_URL;
export const OLOOLUA_SITE_URL = (env && /^https:\/\//.test(env) ? env : 'https://oloolua-youth-guardians.vercel.app').replace(/\/+$/, '');

/** The SIHU (Sango Information Hub) website, kept in its own design. Must match SIHU_SITE in next.config.ts. */
const sihuEnv = process.env.NEXT_PUBLIC_SIHU_PORTAL_URL;
export const SIHU_SITE_URL = (sihuEnv && /^https:\/\//.test(sihuEnv) ? sihuEnv : 'https://sihu-com-t86m.vercel.app').replace(/\/+$/, '');

export const HUB_SITE_URL = { oloolua: OLOOLUA_SITE_URL, sihu: SIHU_SITE_URL } as const;
