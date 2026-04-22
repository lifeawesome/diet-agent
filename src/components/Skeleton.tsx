'use client'

export function Skeleton({ width = '100%', height = '1rem', radius = 6 }: {
  width?: string | number
  height?: string | number
  radius?: number
}) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, var(--border) 25%, var(--bg-subtle) 50%, var(--border) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  )
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div>
        <Skeleton width={120} height={12} />
        <div style={{ marginTop: 8 }}><Skeleton width={280} height={36} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width={80} height={10} />
            <Skeleton width="60%" height={40} />
            <Skeleton width={100} height={12} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width={60} height={10} />
            <Skeleton width="50%" height={28} />
            <Skeleton width={80} height={10} />
          </div>
        ))}
      </div>
    </div>
  )
}
