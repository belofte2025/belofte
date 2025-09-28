// utils/format.ts

export const formatCurrency = (value: number): string => {
  return `₵ ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
