'use client'

import dynamic from 'next/dynamic'
const LineChart = dynamic(
  () =>
    import('recharts').then(m => {
      const { LineChart, Line, ResponsiveContainer } = m
      return function Chart({
        pts,
      }: {
        pts: { at: string; value: number }[]
      }) {
        const data = pts.map((p, i) => ({ i, v: p.value, at: p.at }))
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke="#2F5944"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )
      }
    }),
  { ssr: false },
)

type Props = {
  data: { at: string; value: number }[]
}

export function Sparkline({ data }: Props) {
  if (data.length < 2) return null
  return <LineChart pts={data} />
}
