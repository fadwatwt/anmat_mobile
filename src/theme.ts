export const lightColors = {
  primary: '#375DFB',
  primaryLight: '#EBF1FF',
  primaryDark: '#2E4CDB',

  background: '#F6F8FA',
  surface: '#FFFFFF',

  ink: '#111827',
  textSecondary: '#4B5563',
  textCell: '#525866',
  textMuted: '#757C8A',

  border: '#E2E4E9',
  borderLight: '#F0F1F3',

  success: '#38C793',
  successBg: '#E7F8ED',
  successText: '#1F7A3F',
  danger: '#DF1C41',
  dangerBg: '#FEE2E5',
  dangerText: '#C9372C',
  warning: '#F17B2C',
  warningBg: '#FFF7E6',
  warningText: '#B7791F',
  info: '#375DFB',
  infoBg: '#EBF1FF',
  infoText: '#162664',

  card: '#FFFFFF',
  soft: '#EBF1FF',
  softBorder: '#C2D6FF',

  menuIcon: '#525866',
  menuActiveText: '#375DFB',
  menuActiveBg: '#EBF2FF',

  badgeBg: '#EBF1FF',
  badgeText: '#162664',
  pageTitle: '#525866',
  tableTitle: '#0A0D14',
  cellPrimary: '#525866',
  cellSecondary: '#757C8A',
  statusBg: '#F6F8FA',
  statusBorder: '#E2E4E9',
};

export const darkColors: typeof lightColors = {
  primary: '#375DFB',
  primaryLight: '#EBF1FF21',
  primaryDark: '#2E4CDB',

  background: '#161922',
  surface: '#20232D',

  ink: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textCell: '#CDD0D5',
  textMuted: '#CDD0D5',

  border: '#31353F',
  borderLight: '#2A2E38',

  success: '#2D9F75',
  successBg: '#1A3A2E',
  successText: '#4ADE80',
  danger: '#DF1C41',
  dangerBg: '#3A1A22',
  dangerText: '#F87171',
  warning: '#F17B2C',
  warningBg: '#3A2E1A',
  warningText: '#FBBD7B',
  info: '#375DFB',
  infoBg: '#1A223A',
  infoText: '#93B4FF',

  card: '#20232D',
  soft: '#1A223A',
  softBorder: '#C2D6FF',

  menuIcon: '#E2E4E9',
  menuActiveText: '#F6F8FA',
  menuActiveBg: '#375DFB',

  badgeBg: '#375DFB24',
  badgeText: '#E2E4E9',
  pageTitle: '#CDD0D5',
  tableTitle: '#F6F8FA',
  cellPrimary: '#CDD0D5',
  cellSecondary: '#CDD0D5',
  statusBg: '#20232D',
  statusBorder: '#31353F',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  full: 9999,
};

export const font = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    '3xl': 30,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};
