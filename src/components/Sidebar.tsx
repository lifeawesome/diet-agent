'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const NAV = [
  { href: '/dashboard', label: 'Dashboard',  icon: '⬡' },
  { href: '/log',       label: 'Log',         icon: '＋' },
  { href: '/meals',     label: 'Meals',        icon: '◍' },
  { href: '/trends',    label: 'Trends',       icon: '∿' },
  { href: '/chat',      label: 'Chat',         icon: '◎' },
  { href: '/progress',  label: 'Progress',     icon: '◫' },
  { href: '/billing',   label: 'Billing',      icon: '◆' },
  { href: '/settings',  label: 'Settings',     icon: '⚙' },
]

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
            : 'Set your plan in Settings'
        )
      )
      .catch(() => setPlanTagline('Health coaching'))
  }, [])

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      borderRight: '1px solid var(--border)',
      background: 'var(--bg-card)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.75rem 1rem',
      gap: '0.25rem',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 0.5rem 1.75rem' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          color: 'var(--accent-dark)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          Diet<span style={{ color: 'var(--sage-300)' }}>Agent</span>
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginTop: '4px',
          letterSpacing: '0.04em',
        }}>{planTagline ?? '…'}</div>
      </div>

      {/* Nav items */}
      {NAV.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className={`nav-item ${path.startsWith(href) ? 'active' : ''}`}
        >
          <span style={{
            width: '20px',
            textAlign: 'center',
            fontSize: '16px',
            opacity: path.startsWith(href) ? 1 : 0.6,
          }}>{icon}</span>
          {label}
        </Link>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      <div style={{ padding: '0.5rem 0.875rem', marginTop: '0.5rem' }}>
        {onSignOut ? (
          <button
            type="button"
            onClick={onSignOut}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              fontSize: 13,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            Sign out
          </button>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--accent-light)',
              border: '1px solid var(--border-sage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              color: 'var(--accent-dark)',
              fontWeight: 500,
            }}>U</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>User</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Account</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
