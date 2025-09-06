// client/src/utils/helpers.ts

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};

export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export {};