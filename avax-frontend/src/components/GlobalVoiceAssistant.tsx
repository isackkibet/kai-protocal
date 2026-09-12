'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Mic, X, Sparkles, Bot, Volume2, ArrowRight, CheckCircle2, Loader2, Navigation, Send } from 'lucide-react';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import AgentProposalCard, { AgentProposal } from '@/components/AgentProposalCard';

export default function GlobalVoiceAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [statusText, setStatusText] = useState('Tap the microphone and speak…');
  const [loading, setLoading] = useState(false);
  const [latestProposal, setLatestProposal] = useState<AgentProposal | null>(null);
  const [replyText, setReplyText] = useState<string | null>(null);

  // Auto-hide floating button on the dedicated full-screen /ai page to avoid duplicate mic buttons
  const isAgentPage = pathname === '/ai';

  const {
    isListening,
    isSpeaking,
    transcript,
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

  const handleVoiceCommand = async (command: string) => {
    if (!command.trim()) return;
    setLoading(true);
    setStatusText(`Processing: "${command}"…`);
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
    } catch (err) {
      const errReply = 'I could not process that command. Please try again.';
      setStatusText(errReply);
      setReplyText(errReply);
      speak(errReply);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Voice Assistant HUD Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4,6,5,0.85)',
            backdropFilter: 'blur(20px)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              margin: '0 auto',
              background: '#0a0f0d',
              borderRadius: 24,
              border: '1px solid rgba(16,185,129,0.3)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.8), 0 0 32px rgba(16,185,129,0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #34d399, #065f46)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot size={15} color="#fff" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>KAI Voice Command</h4>
                  <p style={{ margin: 0, fontSize: 10, color: '#34d399', fontWeight: 600 }}>Avalanche C-Chain Agent</p>
                </div>
              </div>

              <button
                onClick={() => {
                  stopListening();
                  cancelSpeech();
                  setIsOpen(false);
                }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Audio Wave Visualizer & Central Mic */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '10px 0' }}>
                <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Pulsing Ripples */}
                  {isListening && (
                    <>
                      <span
                        style={{
                          position: 'absolute',
                          inset: -14,
                          borderRadius: '50%',
                          border: '2px solid rgba(52,211,153,0.6)',
                          animation: 'pulse 1.5s ease-out infinite',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          inset: -28,
                          borderRadius: '50%',
                          border: '1px solid rgba(52,211,153,0.3)',
                          animation: 'pulse 1.5s 0.5s ease-out infinite',
                        }}
                      />
                    </>
                  )}

                  <button
                    onClick={toggleListening}
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: '50%',
                      background: isListening
                        ? 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #065f46 100%)'
                        : 'rgba(16,185,129,0.15)',
                      border: isListening ? '2px solid #fff' : '1px solid rgba(16,185,129,0.4)',
                      boxShadow: isListening
                        ? '0 0 32px rgba(16,185,129,0.8)'
                        : '0 4px 12px rgba(0,0,0,0.3)',
                      color: isListening ? '#fff' : '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Mic size={32} strokeWidth={isListening ? 2.5 : 2} />
                  </button>
                </div>

                {/* Status Indicator */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: isListening ? '#34d399' : 'rgba(255,255,255,0.7)',
                    textAlign: 'center',
                    minHeight: 20,
                  }}
                >
                  {interimTranscript || statusText}
                </p>
              </div>

              {/* Spoken Response Text */}
              {replyText && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    fontSize: 13,
                    color: '#fff',
                    lineHeight: 1.5,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: replyText
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`(.*?)`/g, '<code style="background:rgba(16,185,129,0.15);padding:1px 5px;border-radius:4px;font-size:11px;color:#34d399;">$1</code>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
              )}

              {/* Proposal Card (if transaction generated) */}
              {latestProposal && (
                <div style={{ marginTop: 4 }}>
                  <AgentProposalCard proposal={latestProposal} onSuccess={() => {
                    speak("Transaction confirmed on Avalanche!");
                  }} />
                </div>
              )}

              {/* Quick Voice Prompt Suggestions */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Try Saying:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Transfer 10 NVR to nursery',
                    'Deposit 25 yBOB in vault',
                    'Pay 500 KES via M-Pesa',
                    'Take me to Yield Vaults',
                    'Verify tree nursery batch #07',
                    'Check my wallet balance',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleVoiceCommand(chip)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 20,
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      🎙️ {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
