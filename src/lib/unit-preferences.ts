/**
 * Display units for metrics that support alternate units (see API `lib/units.ts`).
 * When the user has no saved preference, the first option in `availableDisplayUnits[key]` applies.
 */

export const PREFERENCE_KEY_LABELS: Record<string, string> = {
  weight: 'Weight',
  waist:  'Waist circumference',
  water:  'Water intake',
}

export const UNIT_LABELS: Record<string, string> = {
  kg:    'Kilograms (kg)',
  lb:    'Pounds (lb)',
  cm:    'Centimeters (cm)',
  in:    'Inches (in)',
  ml:    'Milliliters (ml)',
  fl_oz: 'Fluid ounces — US (fl oz)',
}

/** Effective choice per key: saved value, else API default (first listed unit). */
export function effectiveUnitPreferences(
  saved: Record<string, string>,
  available: Record<string, readonly string[]>
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(available)) {
    const opts = available[key]
    const first = opts[0]
    if (!first) continue
    out[key] = saved[key] ?? first
  }
  return out
}
