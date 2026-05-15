'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getDashboardConnectCtaLabel } from '@/lib/clients'

function navLinks() {
  return [
    { href: '/dashboard',   label: 'Dashboard', icon: '⬡' },
    { href: '/connect',     label: getDashboardConnectCtaLabel(), icon: '◇' },
    { href: '/connections', label: 'AI connections', icon: '◎' },
    { href: '/billing',     label: 'Billing', icon: '◆' },
    { href: '/settings',    label: 'Settings', icon: '⚙' },
  ]
}

type SidebarProps = {
  onSignOut?: () => void
}

export function Sidebar({ onSignOut }: SidebarProps) {
  const path = usePathname()
  const [planTagline, setPlanTagline] = useState<string | null>(null)

  useEffect(() => {
    api
      .getCoaching()
      .then(c =>
        setPlanTagline(
          c.activeDietPlan
            ? `${c.activeDietPlan.name} · active`
            : 'Set your plan in Settings',
        ),
      )
      .catch(() => setPlanTagline('Health coaching'))
  }, [])

  return (
    <aside
      style={{
        width:         '220px',
        minHeight:     '100vh',
        borderRight:   '1px solid var(--border)',
        background:    'var(--bg-card)',
        display:       'flex',
        flexDirection: 'column',
        padding:       '1.75rem 1rem',
        gap:           '0.25rem',
        flexShrink:    0,
      }}
    >
      <div style={{ padding: '0 0.5rem 1.75rem' }}>
        <div
          style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '22px',
            color:         'var(--accent-dark)',
            letterSpacing: '-0.02em',
            lineHeight:    1,
          }}
        >
          Diet<span style={{ color: 'var(--sage-300)' }}>Agent</span>
        </div>
        <div
          style={{
            fontSize:      '11px',
            color:         'var(--text-muted)',
            marginTop:     '4px',
            letterSpacing: '0.04em',
          }}
        >
          {planTagline ?? '…'}
        </div>
      </div>

      {navLinks().map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className={`nav-item ${path.startsWith(href) ? 'active' : ''}`}
        >
          <span
            style={{
              width:      '20px',
              textAlign:  'center',
              fontSize:   '16px',
              opacity:    path.startsWith(href) ? 1 : 0.6,
            }}
          >
            {icon}
          </span>
          {label}
        </Link>
      ))}

      <div style={{ flex: 1 }} />

      <div style={{ padding: '0.5rem 0.875rem', marginTop: '0.5rem' }}>
        {onSignOut ? (
          <button
            type="button"
            onClick={onSignOut}
            style={{
              width:         '100%',
              padding:       '0.5rem 0.75rem',
              borderRadius:  'var(--radius-md)',
              border:        '1px solid var(--border)',
              background:    'var(--bg-card)',
              fontSize:      13,
              cursor:        'pointer',
              color:         'var(--text-secondary)',
            }}
          >
            Sign out
          </button>
        ) : null}
      </div>
    </aside>
  )
}
