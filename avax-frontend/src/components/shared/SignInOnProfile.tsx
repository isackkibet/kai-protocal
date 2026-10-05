'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Sign-in lives in one place: the Profile page. Everywhere else links there
 * with ?next=<this page>, and Profile sends the person back once signed in.
 */
export const signInHref = (path?: string | null) =>
  path && path !== '/profile' ? `/profile?next=${encodeURIComponent(path)}` : '/profile';

/** A safe place to return to after sign-in: same-site paths only. */
export const safeNext = (v: string | null) => (v && /^\/(?![/\\])/.test(v) && !v.startsWith('/profile') ? v : null);

/** For buttons that need sign-in before they act (comment, save...). */
export function useGoToSignIn() {
  const router = useRouter();
  const path = usePathname();
  return () => router.push(signInHref(path));
}

export default function SignInOnProfile({ label = 'Sign in on your Profile', className, style }: {
  label?: string; className?: string; style?: React.CSSProperties;
}) {
  const path = usePathname();
  return <Link href={signInHref(path)} className={className} style={{ textDecoration: 'none', ...style }} prefetch={false}>{label}</Link>;
}
