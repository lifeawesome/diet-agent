import Link from 'next/link'
import { ClientNamesPhrase } from '@/components/marketing/ClientNamesPhrase'

export default function MarketingHomePage() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '4rem 2rem 5rem',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 5vw, 2.75rem)',
          lineHeight: 1.15,
          marginBottom: '1rem',
          color: 'var(--text-primary)',
        }}
      >
        Health coaching that fits your plan
      </h1>
      <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
        Track meals and metrics, see rolling averages and goals, and connect DietAgent with{' '}
        <ClientNamesPhrase /> using MCP so your subscribed assistant can read your dashboard and log on your behalf.
        Sign in with a paid subscription to use the full dashboard.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none', padding: '0.65rem 1.5rem' }}>
          Get started
        </Link>
        <Link
          href="/login"
          style={{
            padding: '0.65rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: 15,
          }}
        >
          Log in
        </Link>
      </div>
    </div>
  )
}
