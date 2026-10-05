import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HubDashboard from '@/components/hubs/HubDashboard';
import { HUBS, isHubId } from '@/lib/hubs/hub-content';

/**
 * /hubs/<hub>/admin — where hub managers publish and manage what the hub's
 * own website shows: news, stories, activities, photos, videos, podcasts.
 */
export async function generateMetadata({ params }: { params: Promise<{ hub: string }> }): Promise<Metadata> {
  const { hub } = await params;
  return { title: isHubId(hub) ? `${HUBS[hub].name} · Admin` : 'Hub admin', robots: { index: false } };
}

export default async function HubAdminPage({ params }: { params: Promise<{ hub: string }> }) {
  const { hub } = await params;
  if (!isHubId(hub)) notFound();
  return <HubDashboard hub={hub} name={HUBS[hub].name} org={HUBS[hub].org} />;
}
