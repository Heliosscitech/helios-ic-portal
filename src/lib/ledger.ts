export const isIncome = (tip: string): boolean => {
  const t = tip.toLowerCase();
  return t === 'gelir' || t === 'income' || t === 'tahsilat';
};

export const isExpense = (tip: string): boolean => {
  const t = tip.toLowerCase();
  return t === 'gider' || t === 'expense' || t === 'harcama' || t === 'odeme';
};
