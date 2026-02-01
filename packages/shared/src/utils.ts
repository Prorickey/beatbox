import { PROGRESS_BAR } from './constants';

export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number): string => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

export function createProgressBar(
  current: number,
  total: number,
  length: number = PROGRESS_BAR.LENGTH,
): string {
  if (total <= 0) return PROGRESS_BAR.EMPTY.repeat(length);

  const progress = Math.max(0, Math.min(current / total, 1));
  const filledLength = Math.round(progress * length);
  const emptyLength = length - filledLength;

  return PROGRESS_BAR.FILLED.repeat(filledLength) + PROGRESS_BAR.EMPTY.repeat(emptyLength);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}
