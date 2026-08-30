'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, Pickaxe, BrainCircuit, Vault, Shield, CreditCard } from 'lucide-react';

const navItems = [
  { name: 'Home',     href: '/',        icon: Home },
  { name: 'Airdrop',  href: '/mine',    icon: Pickaxe },
  { name: 'Pay',      href: '/pay',     icon: CreditCard },
  { name: 'Policy',   href: '/nuvari',  icon: Shield },
  { name: 'Agent',    href: '/ai',      icon: BrainCircuit },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {navItems.map(({ name, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={name} href={href}
            style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:"2px", textDecoration:"none",
              color: active ? "#e84142" : "rgba(255,255,255,0.4)",
              transition: "color 0.2s ease",
              minWidth: "52px",
            }}>
            {name === "KAI" ? (
              <div style={{
                width: 44, height: 44, borderRadius:"50%",
                background: active ? "linear-gradient(135deg,#FFD700,#F97316)" : "rgba(255,215,0,0.1)",
                border: active ? "2px solid #FFD700" : "2px solid rgba(255,215,0,0.3)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow: active ? "0 0 20px rgba(255,215,0,0.5)" : "none",
              }}>
                <Icon size={20} color={active ? "#1B4332" : "#FFD700"} strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontSize:10, fontWeight: active ? 700 : 500 }}>{name}</span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
