'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAIChatStore } from '@/store/useAIChatStore';
import KaiAgentChat from './KaiAgentChat';

/**
 * Global chat-agent overlay — a bottom sheet that slides over whatever screen
 * the user is on, like the assistant panel in ChatGPT/Intercom, instead of
 * navigating away to a separate full page.
 */
export default function AIChatOverlay() {
  const isOpen = useAIChatStore(s => s.isOpen);
  const close  = useAIChatStore(s => s.close);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="ai-chat-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            }}
          />
          <motion.div
            key="ai-chat-panel"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label="KAI Agent chat"
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
              height: '92dvh', maxWidth: 480, margin: '0 auto',
              borderRadius: '22px 22px 0 0', overflow: 'hidden',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.55)',
              background: '#0a0a0f',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0', flexShrink: 0, background: '#0a0a0f' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.20)' }} />
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <KaiAgentChat onClose={close} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
