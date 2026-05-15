'use client'

import { useState } from 'react'

type Props = {
  step: string
  alt: string
}

type ImgState = 'loading' | 'loaded' | 'error'

/** Screenshots live at `/public/images/connect/${step}.png` */
export function ConnectStepImage({ step, alt }: Props) {
  const [state, setState] = useState<ImgState>('loading')
  const src = `/images/connect/${step}.png`

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-dashed border-sand-300 bg-sand-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-150 ${
          state === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setState('loaded')}
        onError={() => setState('error')}
      />
      {state === 'error' ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-sand-100 p-4 text-center font-body text-sm text-sage-500">
          Screenshot unavailable — steps above still apply
        </div>
      ) : null}
    </div>
  )
}
