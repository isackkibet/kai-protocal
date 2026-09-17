'use client';

import { useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Volume2, VolumeX, Keyboard, Send, Loader2 } from 'lucide-react';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import AgentProposalCard, { AgentProposal } from '@/components/AgentProposalCard';

type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

const STATE_META: Record<AgentState, { label: string; color: string; glow: string }> = {
  idle: { label: 'Tap to speak, or just start talking', color: '#34d399', glow: 'rgba(52,211,153,0.35)' },
  listening: { label: 'Listening…', color: '#34d399', glow: 'rgba(52,211,153,0.65)' },
  thinking: { label: 'Thinking…', color: '#a78bfa', glow: 'rgba(167,139,250,0.6)' },
  speaking: { label: 'Speaking…', color: '#38bdf8', glow: 'rgba(56,189,248,0.6)' },
};

const SUGGESTIONS = [
  'Transfer 10 NVR to nursery',
  'Deposit 25 yBOB in vault',
  'Pay 500 KES via M-Pesa',
  'Take me to Yield Vaults',
  'Check my wallet balance',
];

export default function GlobalVoiceAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [statusText, setStatusText] = useState('Tap to speak, or just start talking');
  const [loading, setLoading] = useState(false);
  const [latestProposal, setLatestProposal] = useState<AgentProposal | null>(null);
  const [replyText, setReplyText] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textDraft, setTextDraft] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);

  // Auto-hide floating button on the dedicated full-screen /ai page to avoid duplicate mic buttons
  const isAgentPage = pathname === '/ai';

  const {
    isListening,
    isSpeaking,
    interimTranscript,
    isSupported,
    volumeLevel,
    speechEnabled,
    setSpeechEnabled,
    startListening,
    stopListening,
    toggleListening,
    speak,
    cancelSpeech,
  } = useVoiceAgent({
    onTranscript: (text) => {
      setStatusText(text);
    },
    onIntentDetected: (finalText) => {
      handleVoiceCommand(finalText);
    },
  });

  const agentState: AgentState = loading ? 'thinking' : isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle';
  const meta = STATE_META[agentState];

  const handleVoiceCommand = async (command: string) => {
    if (!command.trim()) return;
    setLoading(true);
    setStatusText(`"${command}"`);
    setLatestProposal(null);
    setReplyText(null);

    try {
      const res = await fetch('/api/agent/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: command }),
      });

      if (!res.ok) throw new Error('Intent processing error');

      const data = await res.json();

      setReplyText(data.displayText || data.spokenReply);

      // Play audio spoken feedback
      if (data.spokenReply) {
        speak(data.spokenReply);
      }

      // Handle on-chain proposal
      if (data.proposal) {
        setLatestProposal(data.proposal);
      }

      // Handle navigation
      if (data.navigationPath && !data.proposal) {
        setTimeout(() => {
          router.push(data.navigationPath);
          setIsOpen(false);
        }, 1200);
      }
    } catch {
      const errReply = 'I could not process that command. Please try again.';
      setStatusText(errReply);
      setReplyText(errReply);
      speak(errReply);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopListening();
    cancelSpeech();
    setIsOpen(false);
    setShowTextInput(false);
    setTextDraft('');
    setReplyText(null);
    setLatestProposal(null);
    setStatusText('Tap to speak, or just start talking');
  };

  const submitTextDraft = () => {
    const value = textDraft.trim();
    if (!value) return;
    setTextDraft('');
    setShowTextInput(false);
    handleVoiceCommand(value);
  };

  const captionText = interimTranscript || (agentState === 'idle' ? '' : statusText);

  // Orb motion per agent state
  const orbAnimate =
    agentState === 'listening'
      ? { scale: 1 + volumeLevel / 220 }
      : agentState === 'thinking'
      ? { scale: [1, 1.05, 1], rotate: [0, 180, 360] }
      : agentState === 'speaking'
      ? { scale: [1, 1.09, 1] }
      : { scale: [1, 1.035, 1] };

  const orbTransition =
    agentState === 'listening'
      ? { duration: 0.15, ease: 'easeOut' as const }
      : agentState === 'thinking'
      ? { duration: 2.2, repeat: Infinity, ease: 'linear' as const }
      : agentState === 'speaking'
      ? { duration: 0.85, repeat: Infinity, ease: 'easeInOut' as const }
      : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' as const };

  if (!isSupported || isAgentPage) return null;

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => startListening(), 200);
          }}
          title="Voice Agent Assistant"
          aria-label="Open KAI voice assistant"
          style={{
            position: 'fixed',
            bottom: 84,
            right: 18,
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #047857 100%)',
            boxShadow: '0 4px 20px rgba(16,185,129,0.5), 0 0 0 1px rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            zIndex: 90,
            cursor: 'pointer',
            border: 'none',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.92)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ position: 'relative' }}>
            <Mic size={22} color="#fff" />
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#34d399',
                border: '1.5px solid #000',
              }}
            />
          </div>
        </button>
      )}

      {/* Full-screen Voice Assistant Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'radial-gradient(circle at 50% 30%, rgba(16,40,32,0.95) 0%, #030504 65%, #000 100%)',
              backdropFilter: 'blur(24px)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 18px 0',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 12px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: meta.color,
                    boxShadow: `0 0 6px ${meta.color}`,
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 }}>
                  KAI Voice Agent
                </span>
              </div>

              <button
                onClick={handleClose}
                aria-label="Close voice assistant"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Center stage: orb + status + caption */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 22,
                padding: '0 24px',
                minHeight: 0,
              }}
            >
              <button
                onClick={toggleListening}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
                style={{
                  position: 'relative',
                  width: 168,
                  height: 168,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {/* Outer soft glow */}
                <motion.div
                  animate={{ opacity: agentState === 'idle' ? [0.25, 0.4, 0.25] : [0.5, 0.85, 0.5] }}
                  transition={{ duration: agentState === 'listening' ? 1.1 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${meta.glow} 0%, transparent 70%)`,
                    filter: 'blur(6px)',
                  }}
                />

                {/* Orb body */}
                <motion.div
                  animate={orbAnimate}
                  transition={orbTransition}
                  style={{
                    width: 108,
                    height: 108,
                    borderRadius: '50%',
                    background: `conic-gradient(from 180deg, ${meta.color}, #0a3d2f, ${meta.color})`,
                    boxShadow: `0 0 40px ${meta.glow}, inset 0 0 24px rgba(0,0,0,0.35)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18), rgba(0,0,0,0.25))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {agentState === 'thinking' ? (
                      <Loader2 size={30} color="#fff" strokeWidth={2.4} className="animate-spin" />
                    ) : (
                      <Mic size={30} color="#fff" strokeWidth={2.4} />
                    )}
                  </div>
                </motion.div>
              </button>

              {/* Status label */}
              <div style={{ textAlign: 'center', maxWidth: 340, minHeight: 40 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: meta.color, letterSpacing: 0.2 }}>
                  {meta.label}
                </p>
                <AnimatePresence mode="wait">
                  {captionText && (
                    <motion.p
                      key={captionText}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}
                    >
                      “{captionText}”
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Suggestions — only before a conversation has started */}
              {agentState === 'idle' && !replyText && !latestProposal && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 420 }}>
                  {SUGGESTIONS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleVoiceCommand(chip)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: 11.5,
                        cursor: 'pointer',
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply / proposal panel — slides up when there's content */}
            <AnimatePresence>
              {(replyText || latestProposal) && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    margin: '0 16px 12px',
                    maxHeight: '38vh',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  {replyText && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: 13,
                        color: '#fff',
                        lineHeight: 1.5,
                        maxWidth: 480,
                        width: '100%',
                        margin: '0 auto',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: replyText
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/`(.*?)`/g, '<code style="background:rgba(16,185,129,0.15);padding:1px 5px;border-radius:4px;font-size:11px;color:#34d399;">$1</code>')
                          .replace(/\n/g, '<br/>'),
                      }}
                    />
                  )}

                  {latestProposal && (
                    <div style={{ maxWidth: 480, width: '100%', margin: '0 auto' }}>
                      <AgentProposalCard
                        proposal={latestProposal}
                        onSuccess={() => {
                          speak('Transaction confirmed on Avalanche!');
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text fallback input */}
            <AnimatePresence>
              {showTextInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ padding: '0 16px 10px', flexShrink: 0, overflow: 'hidden' }}
                >
                  <div
                    style={{
                      maxWidth: 480,
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 6px 6px 14px',
                      borderRadius: 24,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <input
                      ref={textInputRef}
                      autoFocus
                      value={textDraft}
                      onChange={(e) => setTextDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitTextDraft();
                        if (e.key === 'Escape') setShowTextInput(false);
                      }}
                      placeholder="Type a command…"
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#fff',
                        fontSize: 13,
                        padding: '8px 0',
                      }}
                    />
                    <button
                      onClick={submitTextDraft}
                      disabled={!textDraft.trim()}
                      aria-label="Send"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: 'none',
                        background: textDraft.trim() ? '#10b981' : 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: textDraft.trim() ? 'pointer' : 'default',
                        flexShrink: 0,
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom control bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 22,
                padding: '4px 16px 28px',
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                aria-label={speechEnabled ? 'Mute agent voice' : 'Unmute agent voice'}
                aria-pressed={!speechEnabled}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: speechEnabled ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>

              <button
                onClick={() => {
                  setShowTextInput((prev) => !prev);
                  if (isListening) stopListening();
                }}
                aria-label="Type instead of speaking"
                aria-pressed={showTextInput}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: showTextInput ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
                  border: showTextInput ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  color: showTextInput ? '#34d399' : 'rgba(255,255,255,0.75)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Keyboard size={18} />
              </button>

              <button
                onClick={handleClose}
                aria-label="End voice session"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f87171, #dc2626)',
                  border: 'none',
                  color: '#fff',
                  boxShadow: '0 4px 18px rgba(220,38,38,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={22} strokeWidth={2.4} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
