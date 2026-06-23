import { format } from 'date-fns';
import { DAILY_QUOTES, ENCOURAGEMENTS } from '../constants/quotes';

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return h;
}

function getCryptoRandomInt(max: number): number {
  const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    cryptoObj.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function getDailyQuote(dateStr?: string): string {
  if (DAILY_QUOTES.length === 0) {
    throw new Error('DAILY_QUOTES is empty');
  }
  const date = dateStr ?? format(new Date(), 'yyyy-MM-dd');
  const idx = Math.abs(hashString(date)) % DAILY_QUOTES.length;
  return DAILY_QUOTES[idx];
}

export function getRandomEncouragement(): string {
  if (ENCOURAGEMENTS.length === 0) {
    throw new Error('ENCOURAGEMENTS is empty');
  }
  const idx = getCryptoRandomInt(ENCOURAGEMENTS.length);
  return ENCOURAGEMENTS[idx];
}
