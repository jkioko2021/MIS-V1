const palettes = {
  extreme: { row: 'bg-rose-50/70', badge: 'bg-rose-100 text-rose-900', edge: 'border-l-rose-500', outline: 'outline-rose-400' },
  high: { row: 'bg-orange-50/70', badge: 'bg-orange-100 text-orange-900', edge: 'border-l-orange-500', outline: 'outline-orange-400' },
  moderate: { row: 'bg-amber-50/70', badge: 'bg-amber-100 text-amber-900', edge: 'border-l-amber-500', outline: 'outline-amber-400' },
  low: { row: 'bg-emerald-50/70', badge: 'bg-emerald-100 text-emerald-900', edge: 'border-l-emerald-500', outline: 'outline-emerald-400' },
};
const neutral = { row: 'bg-muted/20', badge: 'bg-muted text-muted-foreground', edge: 'border-l-border', outline: 'outline-border' };

export function riskExposureColors(level: string) {
  return palettes[level.trim().toLowerCase() as keyof typeof palettes] ?? neutral;
}
