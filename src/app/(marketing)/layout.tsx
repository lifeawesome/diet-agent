import Link from 'next/link'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            color: 'var(--accent-dark)',
            textDecoration: 'none',
            letterSpacing: '-0.02em',
          }}
        >
          Diet<span style={{ color: 'var(--sage-300)' }}>Agent</span>
        </Link>
        <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Log in
          </Link>
          <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none', fontSize: 14 }}>
            Sign up
          </Link>
        </nav>
      </header>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
