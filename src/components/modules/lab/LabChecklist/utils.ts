export const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

export const getWeekKey = (monday: Date, tabId: string): string => {
  const year = monday.getFullYear();
  const month = monday.getMonth() + 1;
  const day = monday.getDate();
  return tabId === 'aylik' ? `${year}-${month}` : `${year}-${month}-${day}`;
};
