import { create } from 'zustand';
import api from '../api/axios';
import type { TenantSettings } from '../utils/settingsUtils';

interface SettingsState {
  settings: TenantSettings;
  loading: boolean;
  fetchSettings: () => Promise<TenantSettings>;
  updateSettingsState: (newSettings: TenantSettings) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: (() => {
    try {
      const cached = localStorage.getItem('tenantSettings');
      if (cached) return JSON.parse(cached);
    } catch {}
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
  })(),
  loading: false,
  fetchSettings: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/settings');
      if (res.data && res.data.success) {
        const s = res.data.data;
        localStorage.setItem('tenantSettings', JSON.stringify(s));
        set({ settings: s, loading: false });
        return s;
      }
    } catch (e) {
      console.warn("Failed to fetch settings from API, using cache/defaults");
    }
    set({ loading: false });
    return getTenantSettingsFromStore();
  },
  updateSettingsState: (newSettings: TenantSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      localStorage.setItem('tenantSettings', JSON.stringify(updated));
      return { settings: updated };
    });
  }
}));

const getTenantSettingsFromStore = (): TenantSettings => {
  try {
    const cached = localStorage.getItem('tenantSettings');
    if (cached) return JSON.parse(cached);
  } catch {}
  return {};
};
