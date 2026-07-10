export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const isDateBefore = (date1: string, date2: string): boolean => {
  return new Date(date1) < new Date(date2);
};
