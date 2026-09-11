'use client';

import KaiAgentChat from '@/components/ai/KaiAgentChat';

export default function AIPage() {
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <KaiAgentChat />
    </div>
  );
}
