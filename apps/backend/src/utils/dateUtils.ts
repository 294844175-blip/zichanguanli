export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function isExpiringSoon(endDate: Date, thresholdMonths: number = 3): boolean {
  const now = new Date();
  const threshold = addMonths(now, thresholdMonths);
  return endDate <= threshold && endDate > now;
}

export function isOverdue(endDate: Date): boolean {
  return new Date() > endDate;
}

export function getPeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
