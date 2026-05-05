export const PRIMARY_CURRENCY = 'TRY';

const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: '₺',
  TL: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const symbolFor = (currency: string | null | undefined): string => {
  const cur = currency ?? PRIMARY_CURRENCY;
  return CURRENCY_SYMBOLS[cur] ?? `${cur} `;
};

export const formatMoney = (n: number, currency?: string | null): string => {
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${symbolFor(currency)}${formatted}`;
};

export const formatMoneyCompact = (n: number, currency?: string | null): string => {
  const sym = symbolFor(currency);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sym}${(n / 1_000).toFixed(1)}K`;
  return `${sym}${n.toFixed(0)}`;
};

export const isTRY = (currency: string | null | undefined): boolean =>
  !currency || currency === 'TRY' || currency === 'TL';
