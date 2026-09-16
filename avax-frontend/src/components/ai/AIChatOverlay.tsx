'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAIChatStore } from '@/store/useAIChatStore';
import KaiAgentChat from './KaiAgentChat';

/**
 * Global chat-agent overlay — a full-screen, voice-agent-style takeover that
 * slides over whatever screen the user is on, instead of navigating away to a
 * separate full page.
 */
export default function AIChatOverlay() {
  const isOpen = useAIChatStore(s => s.isOpen);
  const close  = useAIChatStore(s => s.close);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ai-chat-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: '3%' }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-label="KAI Agent chat"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <KaiAgentChat onClose={close} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}