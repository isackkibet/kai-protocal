'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ListChecks, Mail, Wallet, Trophy, Gift, Loader2, CheckCircle2, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';
import { useKaiBar } from '@/hooks/useKaiBar';

const Rs: React.CSSProperties = { textShadow: '0 1px 4px rgba(0,0,0,0.88)' };
const W: React.CSSProperties = { width: '100%', maxWidth: 560, margin: '0 auto', padding: '0 20px' };

function Row({ icon, label, value, valueColor, mono }: { icon: React.ReactNode; label: string; value: string; valueColor?: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
      borderRadius: 14, background: 'rgba(255,255,255,0.03)',
      boxShadow: '0 0 0 0.5px rgba(255,255,255,0.07) inset',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 3px' }}>{label}</p>
        <p style={{
          fontSize: mono ? 13 : 14, fontWeight: 800, margin: 0, color: valueColor ?? 'rgba(255,255,255,0.92)',
          fontFamily: mono ? 'monospace' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function WaitlistPage() {
  const { authenticated, ready, email, address, signInWithGoogle, signInWithEmail } = usePrivyAuth();
  const { kaiBar, airdrop, loading } = useKaiBar();
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  if (!ready) {
    return <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={26} color="#10b981" /></main>;
  }

  if (!authenticated) {
    return (
      <main style={{ minHeight: '100dvh', color: '#fff', fontFamily: 'var(--font-sans)', position: 'relative' }}>
        <div style={{ ...W, paddingTop: 72, textAlign: 'center' }}>
          <div className="float" style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg,rgba(16,185,129,0.4),rgba(4,78,59,0.85))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px rgba(16,185,129,0.35)',
          }}>
            <ListChecks size={30} color="#34d399" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: -0.5, ...Rs }}>
            KAI Nuvari <span style={{ color: '#34d399' }}>Waitlist</span>
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '8px 0 24px', ...Rs }}>
            Sign in to get your Avalanche wallet and join the waitlist instantly.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 260, margin: '0 auto' }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              disabled={emailLoading}
              onClick={async () => {
                setSignInError(null);
                setEmailLoading(true);
                const res = await signInWithEmail();
                setEmailLoading(false);
                if (!res.ok && res.reason !== 'login-cancelled') {
                  setSignInError(res.reason === 'privy-not-configured' ? 'Email sign-in is not configured yet.' : String(res.reason ?? 'Email sign-in failed. Please try again.'));
                }
              }}
              style={{
                padding: '13px 26px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#10b981,#047857)', color: '#fff',
                boxShadow: '0 6px 26px rgba(16,185,129,0.4)', fontSize: 14, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {emailLoading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Continue with Email
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              disabled={googleLoading}
              onClick={async () => {
                setSignInError(null);
                setGoogleLoading(true);
                const res = await signInWithGoogle();
                setGoogleLoading(false);
                if (!res.ok && res.reason !== 'login-cancelled') {
                  setSignInError(res.reason === 'privy-not-configured' ? 'Google sign-in is not configured yet.' : String(res.reason ?? 'Google sign-in failed. Please try again.'));
                }
              }}
              style={{
                padding: '13px 26px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, fontWeight: 800,
              }}>
              Continue with Google
            </motion.button>
            {signInError && (
              <p style={{ fontSize: 11, color: '#f87171', margin: '4px 0 0' }}>{signInError}</p>
            )}
          </div>
        </div>
      </main>
    );
  }

  const walletStatus = address ? 'active' : 'provisioning';

  return (
    <main style={{ minHeight: '100dvh', color: '#fff', fontFamily: 'var(--font-sans)', paddingBottom: 80 }}>
      <div style={{ ...W, paddingTop: 28 }}>
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.48)', margin: 0 }}>KAI Nuvari</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: '4px 0 0', letterSpacing: -0.5, ...Rs }}>
            You&apos;re on the <span style={{ color: '#34d399' }}>Waitlist</span>
          </h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-elevated" style={{
            borderRadius: 20, padding: '18px 18px', marginBottom: 16,
            background: 'linear-gradient(145deg,rgba(6,20,14,0.85),rgba(6,6,14,0.78))',
            boxShadow: '0 1px 0 rgba(255,255,255,0.09) inset, 0 0 0 0.5px rgba(16,185,129,0.22) inset, 0 16px 50px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
          <Row icon={<Mail size={16} color="#34d399" />} label="Account" value={email ?? '—'} />
          <Row
            icon={<Wallet size={16} color="#34d399" />}
            label="Avalanche Wallet"
            value={address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Provisioning…'}
            mono
          />
          <Row
            icon={walletStatus === 'active' ? <CheckCircle2 size={16} color="#34d399" /> : <Clock size={16} color="#fbbf24" />}
            label="Wallet Status"
            value={walletStatus === 'active' ? 'Active on Avalanche' : 'Provisioning'}
            valueColor={walletStatus === 'active' ? '#34d399' : '#fbbf24'}
          />
          <Row
            icon={<Trophy size={16} color="#fbbf24" />}
            label="Current Points"
            value={loading ? '…' : kaiBar.toLocaleString()}
            valueColor="#fbbf24"
          />
          <Row
            icon={<Gift size={16} color={airdrop?.eligible ? '#34d399' : 'rgba(255,255,255,0.5)'} />}
            label="Airdrop Status"
            value={airdrop?.eligible ? 'Eligible' : 'In Progress'}
            valueColor={airdrop?.eligible ? '#34d399' : undefined}
          />
        </motion.div>

        <Link href="/kai-bar" style={{ textDecoration: 'none' }}>
          <div className="hover-shine" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            borderRadius: 16, background: 'rgba(255,255,255,0.03)',
            boxShadow: '0 0 0 0.5px rgba(255,255,255,0.08) inset', marginBottom: 10,
          }}>
            <Trophy size={18} color="rgba(251,191,36,0.7)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 800, margin: 0, color: 'rgba(255,255,255,0.85)' }}>Earn more points</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Daily sign-in, referrals & tasks</p>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
          </div>
        </Link>

        <Link href="/wallet" style={{ textDecoration: 'none' }}>
          <div className="hover-shine" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            borderRadius: 16, background: 'rgba(255,255,255,0.03)',
            boxShadow: '0 0 0 0.5px rgba(255,255,255,0.08) inset',
          }}>
            <ArrowLeft size={18} color="rgba(255,255,255,0.4)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 800, margin: 0, color: 'rgba(255,255,255,0.85)' }}>Back to Wallet</p>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
          </div>
        </Link>
      </div>
    </main>
  );
}
