type ReportingPeriod = { period_id?: number | null; period_from?: string | null; status?: string | null };

/** Latest open reporting cycle; never fall back to a closed period or all periods. */
export function currentOpenPeriod<T extends ReportingPeriod>(periods: T[]): T | undefined {
  return periods.filter(period => period.period_id && period.status?.toUpperCase() === 'OPEN')
    .sort((a, b) => String(b.period_from ?? '').localeCompare(String(a.period_from ?? ''))
      || Number(b.period_id) - Number(a.period_id))[0];
}

/** First configured open cycle after the selected closed register; dates are never invented. */
export function nextOpenPeriod<T extends ReportingPeriod>(periods: T[], sourceEnd: string): T | undefined {
  return periods.filter(period => period.period_id && period.status?.toUpperCase() === 'OPEN'
    && String(period.period_from ?? '') > sourceEnd)
    .sort((a, b) => String(a.period_from ?? '').localeCompare(String(b.period_from ?? ''))
      || Number(a.period_id) - Number(b.period_id))[0];
}
