/** Shown while a page loads: the KAI mark on the app's pine background. */
export default function Loading() {
  return (
    <main style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14,
      background: '#0E2418', color: '#F6F2E7', fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%', background: '#C89B3C', color: '#1B1A14',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22,
      }}>K</div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#C9CFC2' }}>Loading…</p>
    </main>
  );
}
