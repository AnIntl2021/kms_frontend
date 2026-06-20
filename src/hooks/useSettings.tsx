import { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { getOrderNumber, formatCurrency, formatCurrencyValue } from '../utils/settingsUtils';

export const useSettings = () => {
  const { settings, loading, fetchSettings, updateSettingsState } = useSettingsStore();

  return {
    settings,
    loading,
    fetchSettings,
    updateSettingsState,
    getOrderNumber,
    formatCurrency,
    formatCurrencyValue,
    // Quick helpers
    companyName: settings.company_name || 'Ansoftt',
    companyArabicName: settings.company_arabic_name || 'أنسوفت',
    currencySymbol: settings.currency_symbol || 'د.ك',
    currencyCode: settings.currency_code || 'KWD',
    decimals: parseInt(settings.currency_decimals || '3', 10),
    orderPrefix: settings.order_prefix || 'ORD-',
    countryPhoneCode: settings.country_phone_code || '+965',
    businessType: settings.business_type || 'restaurant_pos',
  };
};
