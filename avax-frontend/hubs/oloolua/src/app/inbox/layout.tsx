import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Inbox | Oloolua Youth Guardians',
  robots: { index: false, follow: false },
};

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
