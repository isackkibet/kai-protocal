'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Bot, Gift, UserCircle2, Newspaper } from 'lucide-react';
import { useAIChatStore } from '@/store/useAIChatStore';

const NAV = [
  { name: 'Home',    href: '/',        icon: Home        },
  { name: 'Airdrop', href: '/mine',    icon: Gift        },
  { name: 'Info Hub', href: '/hub',   icon: Newspaper   },
  { name: 'Profile', href: '/profile', icon: UserCircle2 },
];

const itemStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', gap: 4, textDecoration: 'none',
  position: 'relative', padding: '6px 14px', borderRadius: 14,
  minWidth: 56, transition: 'all 0.2s ease',
  background: active ? 'rgba(16,185,129,0.10)' : 'transparent',
  border: 'none', cursor: 'pointer', font: 'inherit',
});

export default function BottomNav() {
  const path = usePathname();
  const isChatOpen = useAIChatStore(s => s.isOpen);
  const toggleChat  = useAIChatStore(s => s.toggle);

  return (
    <nav className="bottom-nav">
      {NAV.map(({ name, href, icon: Icon }) => {
        const active = href === '/' ? path === '/' : path?.startsWith(href);
        return (
          <Link key={name} href={href} style={itemStyle(active)}>
            {active && <motion.span layoutId="nav-indicator" style={{
              position: 'absolute', top: 0, left: '20%', right: '20%',
              height: 2, borderRadius: '0 0 4px 4px',
              background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
            }} />}
            <motion.span
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.9 }}
              style={{ display: 'inline-flex' }}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.7}
                color={active ? '#10b981' : 'rgba(255,255,255,0.32)'}
                style={{ transition: 'all 0.2s', transform: active ? 'scale(1.08) translateY(-1px)' : 'scale(1)' }} />
            </motion.span>
            <span style={{
              fontSize: 11, fontWeight: active ? 800 : 500, letterSpacing: 0.3,
              color: active ? '#10b981' : 'rgba(255,255,255,0.30)', transition: 'all 0.2s',
            }}>{name}</span>
          </Link>
        );
      })}

      {/* Agent opens as a sliding chat overlay rather than navigating to a new page */}
      <button onClick={toggleChat} style={itemStyle(isChatOpen)} aria-pressed={isChatOpen}>
        {isChatOpen && <motion.span layoutId="nav-indicator" style={{
          position: 'absolute', top: 0, left: '20%', right: '20%',
          height: 2, borderRadius: '0 0 4px 4px',
          background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
        }} />}
        <motion.span
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.9 }}
          style={{ display: 'inline-flex' }}
        >
          <Bot size={22} strokeWidth={isChatOpen ? 2.4 : 1.7}
            color={isChatOpen ? '#10b981' : 'rgba(255,255,255,0.32)'}
            style={{ transition: 'all 0.2s', transform: isChatOpen ? 'scale(1.08) translateY(-1px)' : 'scale(1)' }} />
        </motion.span>
        <span style={{
          fontSize: 11, fontWeight: isChatOpen ? 800 : 500, letterSpacing: 0.3,
          color: isChatOpen ? '#10b981' : 'rgba(255,255,255,0.30)', transition: 'all 0.2s',
        }}>Agent</span>
      </button>
    </nav>
  );
}
