import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

const variants = {
  primary:
    'bg-[#2F5944] text-white hover:bg-sage-800 shadow-sm disabled:opacity-60',
  secondary:
    'border border-sand-300 bg-white text-sage-800 hover:bg-sand-50 disabled:opacity-60',
  ghost: 'text-sage-700 hover:bg-sand-100',
} as const

type Variant = keyof typeof variants

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

export function Button({
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-body text-sm font-medium transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
