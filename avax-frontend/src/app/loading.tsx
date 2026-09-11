export default function Loading() {
  return (
    <main style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: '#05060b', color: '#fff',
    }}>
      <div className="float" style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'linear-gradient(135deg,#10b981,#064e3b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 24px rgba(16,185,129,0.45)',
      }}>
        <span style={{ color: '#6ee7b7', fontWeight: 900, fontSize: 22 }}>K</span>
      </div>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.45)' }}>
        LOADING KAI…</p>
    </main>
  );
}