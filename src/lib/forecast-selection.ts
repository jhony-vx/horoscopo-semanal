export interface ForecastLike {
  data: { sign: string; period: string; periodStart: string; status: string };
}

interface PickOptions {
  /** When the exact day is missing, use the latest earlier published forecast. */
  fallback?: boolean;
}

export function pickForecast<T extends ForecastLike>(
  entries: readonly T[],
  sign: string,
  period: string,
  date: string,
  { fallback = false }: PickOptions = {},
): T | undefined {
  const candidates = entries.filter(
    (entry) => entry.data.status === 'published' && entry.data.sign === sign && entry.data.period === period,
  );
  const exact = candidates.find((entry) => entry.data.periodStart === date);
  if (exact || !fallback) return exact;

  return candidates
    .filter((entry) => entry.data.periodStart < date)
    .sort((a, b) => b.data.periodStart.localeCompare(a.data.periodStart))[0];
}
