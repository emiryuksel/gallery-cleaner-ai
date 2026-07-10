export const theme = {
  colors: {
    background: '#05060A',
    backgroundElevated: '#0D0F16',
    glassTint: 'rgba(255, 255, 255, 0.10)',
    glassBorder: 'rgba(255, 255, 255, 0.18)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(235, 238, 245, 0.72)',
    textMuted: 'rgba(235, 238, 245, 0.45)',
    keep: '#3DDC84',
    keepTint: 'rgba(61, 220, 132, 0.85)',
    delete: '#FF5A5F',
    deleteTint: 'rgba(255, 90, 95, 0.85)',
    accent: '#5B8CFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 12,
    md: 20,
    lg: 28,
    xl: 36,
    pill: 999,
  },
  typography: {
    title: { fontSize: 28, fontWeight: '700' as const },
    heading: { fontSize: 20, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    label: { fontSize: 14, fontWeight: '600' as const },
    caption: { fontSize: 12, fontWeight: '500' as const },
  },
} as const;

export type Theme = typeof theme;
