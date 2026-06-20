export interface TenantSettings {
  company_name?: string;
  company_arabic_name?: string;
  company_logo?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  order_prefix?: string;
  currency_code?: string;
  currency_symbol?: string;
  currency_decimals?: string;
  country_phone_code?: string;
  business_type?: string;
}

export const getTenantSettings = (): TenantSettings => {
  try {
    const cached = localStorage.getItem('tenantSettings');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Error reading tenant settings', e);
  }
  return {
    company_name: 'Ansoftt',
    company_arabic_name: 'أنسوفت',
    order_prefix: 'ORD-',
    currency_code: 'KWD',
    currency_symbol: 'د.ك',
    currency_decimals: '3',
    country_phone_code: '+965',
    business_type: 'restaurant_pos',
  };
};

export const getOrderNumber = (saleId: number | string): string => {
  const settings = getTenantSettings();
  const prefix = settings.order_prefix || 'ORD-';
  const num = Number(saleId);
  if (isNaN(num)) return `${prefix}${saleId}`;
  return `${prefix}${100000 + num}`;
};

export const formatCurrency = (amount: number | string): string => {
  const settings = getTenantSettings();
  const symbol = settings.currency_symbol || 'د.ك';
  const decimals = parseInt(settings.currency_decimals || '3', 10);
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return `0.${'0'.repeat(decimals)} ${symbol}`;
  return `${value.toFixed(decimals)} ${symbol}`;
};

export const formatCurrencyValue = (amount: number | string): string => {
  const settings = getTenantSettings();
  const decimals = parseInt(settings.currency_decimals || '3', 10);
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return `0.${'0'.repeat(decimals)}`;
  return value.toFixed(decimals);
};
