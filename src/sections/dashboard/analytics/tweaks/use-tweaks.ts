import { useCallback, useEffect, useState } from 'react';
import type { ChartStyle } from '../modules/sales-dynamics';
import type { DishesStyle } from '../modules/top-dishes';
import type { NumFormat } from '../data/formatters';

export type LayoutId = 'classic' | 'sidebar' | 'editorial' | 'bento';
export type Density = 'comfortable' | 'compact';
export type RadiusOpt = 'sharp' | 'soft' | 'pill';
export type CardStyle = 'flat' | 'outlined' | 'elevated';
export type BgTint = 'cool' | 'warm' | 'neutral';

export interface Tweaks {
  layout: LayoutId;
  chartStyle: ChartStyle;
  dishesStyle: DishesStyle;
  numFormat: NumFormat;
  density: Density;
  compare: boolean;
  radius: RadiusOpt;
  cardStyle: CardStyle;
  bgTint: BgTint;
  sec_kpis: boolean;
  sec_sales: boolean;
  sec_categories: boolean;
  sec_payments: boolean;
  sec_dishes: boolean;
  sec_insights: boolean;
  sec_heatmap: boolean;
}

export const TWEAK_DEFAULTS: Tweaks = {
  layout: 'classic',
  chartStyle: 'line_overlay',
  dishesStyle: 'table',
  numFormat: 'compact',
  density: 'comfortable',
  compare: true,
  radius: 'soft',
  cardStyle: 'outlined',
  bgTint: 'cool',
  sec_kpis: true,
  sec_sales: true,
  sec_categories: true,
  sec_payments: true,
  sec_dishes: true,
  sec_insights: true,
  sec_heatmap: false,
};

const STORAGE_KEY = 'mary.analytics.tweaks';

export function useTweaks() {
  const [tweaks, setTweaks] = useState<Tweaks>(() => {
    if (typeof window === 'undefined') return TWEAK_DEFAULTS;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return TWEAK_DEFAULTS;
      return { ...TWEAK_DEFAULTS, ...(JSON.parse(raw) as Partial<Tweaks>), sec_heatmap: false };
    } catch {
      return TWEAK_DEFAULTS;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
    } catch {
      // ignore
    }
  }, [tweaks]);

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetTweaks = useCallback(() => setTweaks(TWEAK_DEFAULTS), []);

  return { tweaks, setTweak, resetTweaks };
}
