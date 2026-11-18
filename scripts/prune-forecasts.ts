import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { addDays, todayInLima } from '../src/zodiac/calendar.ts';

/** Days of daily readings kept in the repository; older ones remain in git history. */
export const DAILY_RETENTION_DAYS = 30;

const DAILY_FORECAST_FILE = /^[a-z]+-(?:today|tomorrow)-(\d{4}-\d{2}-\d{2})\.md$/;

export function selectExpiredDailyForecasts(fileNames: readonly string[], today: string, retentionDays: number): string[] {
  const oldestKept = addDays(today, -retentionDays);
  return fileNames.filter((name) => {
    const date = DAILY_FORECAST_FILE.exec(name)?.[1];
    return date !== undefined && date < oldestKept;
  });
}

export function pruneDailyForecasts(directory: string, today: string, retentionDays = DAILY_RETENTION_DAYS): string[] {
  const expired = selectExpiredDailyForecasts(readdirSync(directory), today, retentionDays);
  for (const name of expired) rmSync(join(directory, name));
  return expired;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const directory = join(process.cwd(), 'src', 'content', 'forecasts');
  const removed = pruneDailyForecasts(directory, todayInLima());
  console.log(`Pronósticos diarios eliminados: ${removed.length} (se conservan ${DAILY_RETENTION_DAYS} días)`);
}
