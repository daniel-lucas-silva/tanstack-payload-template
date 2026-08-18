const numberFormat = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

export const formatNumber = (value: number) => numberFormat.format(value);
