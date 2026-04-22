/**
 * Client-side display + input helpers aligned with `api/src/lib/units.ts`
 * (canonical storage → preferred display units).
 */

import { effectiveUnitPreferences } from '@/lib/unit-preferences'

export function preferenceKeyForMetricSlug(slug: string): string {
  if (slug === 'weight' || slug === 'weight_kg') return 'weight'
  if (slug === 'waist' || slug === 'waist_cm') return 'waist'
  if (slug === 'water' || slug === 'water_ml') return 'water'
  return slug
}

const KG_TO_LB = 2.2046226218
const CM_TO_IN = 1 / 2.54
const ML_TO_FLOZ = 1 / 29.5735295625

function roundDisplay(n: number): number {
  return Math.round(n * 1000) / 1000
}

/** Canonical `metric_types.unit` for slugs the dashboard logs (convertible metrics). */
export const CANONICAL_UNIT_BY_SLUG: Record<string, string> = {
  weight_kg: 'kg',
  waist_cm:  'cm',
  water_ml:  'ml',
}

export function displayUnitForMetric(
  metricSlug: string,
  canonicalUnit: string,
  prefs: Record<string, string>
): string {
  const key = preferenceKeyForMetricSlug(metricSlug)
  const chosen = prefs[key]
  if (key === 'weight' && canonicalUnit === 'kg' && chosen === 'lb') return 'lb'
  if (key === 'waist' && canonicalUnit === 'cm' && chosen === 'in') return 'in'
  if (key === 'water' && canonicalUnit === 'ml' && chosen === 'fl_oz') return 'fl_oz'
  return canonicalUnit
}

export function toDisplayValue(
  metricSlug: string,
  value: number | null | undefined,
  canonicalUnit: string,
  prefs: Record<string, string>
): { value: number | null; unit: string } {
  const unit = displayUnitForMetric(metricSlug, canonicalUnit, prefs)
  if (value == null) return { value: null, unit }

  const key = preferenceKeyForMetricSlug(metricSlug)
  const chosen = prefs[key]

  if (key === 'weight' && canonicalUnit === 'kg' && chosen === 'lb') {
    return { value: roundDisplay(value * KG_TO_LB), unit: 'lb' }
  }
  if (key === 'waist' && canonicalUnit === 'cm' && chosen === 'in') {
    return { value: roundDisplay(value * CM_TO_IN), unit: 'in' }
  }
  if (key === 'water' && canonicalUnit === 'ml' && chosen === 'fl_oz') {
    return { value: roundDisplay(value * ML_TO_FLOZ), unit: 'fl_oz' }
  }

  return { value: roundDisplay(value), unit }
}

/** User-facing unit suffix for dropdowns and labels. */
export function formatUnitForUi(unit: string): string {
  if (unit === 'fl_oz') return 'fl oz'
  return unit
}

const CONVERTIBLE_LOG_SLUGS = new Set(['weight_kg', 'waist_cm', 'water_ml'])

export function isConvertibleMetricSlug(slug: string): boolean {
  return CONVERTIBLE_LOG_SLUGS.has(slug)
}

/**
 * `inputUnit` to send when logging — matches API `toCanonicalValue` expectations.
 */
export function inputUnitForLogging(
  metricSlug: string,
  canonicalUnit: string,
  prefs: Record<string, string>,
  available: Record<string, readonly string[]>
): string | undefined {
  if (!isConvertibleMetricSlug(metricSlug)) return undefined
  const eff = effectiveUnitPreferences(prefs, available)
  const display = displayUnitForMetric(metricSlug, canonicalUnit, eff)
  if (display === canonicalUnit) return undefined
  return display
}
