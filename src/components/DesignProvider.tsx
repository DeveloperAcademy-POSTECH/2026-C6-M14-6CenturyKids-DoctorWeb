import { FluentProvider, createDarkTheme, createLightTheme, type BrandVariants } from '@fluentui/react-components';
import type { ReactNode } from 'react';
import { useMedia } from '../lib/useMedia.ts';

// Official Fluent controls, with SocDoc's green brand ramp and Korean typography.
const brand: BrandVariants = {
  10: '#07120A', 20: '#102215', 30: '#1D3220', 40: '#29432B',
  50: '#335332', 60: '#3E6338', 70: '#48703B', 80: '#527C3E',
  90: '#608D46', 100: '#759D56', 110: '#90B96A', 120: '#AED684',
  130: '#C5F276', 140: '#D3F69A', 150: '#E7F8C9', 160: '#F2FBE4',
};
const typography = {
  fontFamilyBase: '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", system-ui, sans-serif',
  borderRadiusMedium: '8px',
};
const light = { ...createLightTheme(brand), ...typography };
const dark = { ...createDarkTheme(brand), ...typography };

export default function DesignProvider({ children }: { children: ReactNode }) {
  const isDark = useMedia('(prefers-color-scheme: dark)');
  return <FluentProvider theme={isDark ? dark : light} className="design-provider">{children}</FluentProvider>;
}
