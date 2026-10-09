import { redirect } from 'next/navigation';

// Sign-in lives in the Guardian Hub (Google sign-in, PRD v1.2 B2).
export default function LoginPage() {
  redirect('/portal');
}
