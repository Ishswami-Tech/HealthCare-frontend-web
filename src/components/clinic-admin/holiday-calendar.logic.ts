/** Pure date helpers of the holiday editor (CaHolidayEditor). Days are `YYYY-MM-DD` strings. */

export interface MonthCell {
  day: string;
  inMonth: boolean;
}

const pad = (value: number) => String(value).padStart(2, "0");
export const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Six weeks (Monday first) covering `year`/`month` (0-based). */
export function monthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return { day: dayKey(date), inMonth: date.getMonth() === month };
  });
}

/** The ISO date part of a day or timestamp. */
export const isoDay = (value: string) => value.slice(0, 10);

export function coversDay(range: { startDate: string; endDate: string }, day: string): boolean {
  return isoDay(range.startDate) <= day && day <= isoDay(range.endDate);
}

export function monthBounds(year: number, month: number): { from: string; to: string } {
  return { from: dayKey(new Date(year, month, 1)), to: dayKey(new Date(year, month + 1, 0)) };
}
