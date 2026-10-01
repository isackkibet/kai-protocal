import type { Metadata } from 'next';
import Workspace from '@/components/workspace/Workspace';

export const metadata: Metadata = {
  title: 'Kanuvari AI | KAI Nuvari',
  description: 'Tell Kanuvari what happened in the nursery; review the record and confirm before it is saved.',
};

/** /workspace — the Kanuvari AI workspace (Guardian Setup & AI Architecture, Part 2). */
export default function WorkspacePage() {
  return <Workspace />;
}
