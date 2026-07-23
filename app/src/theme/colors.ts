export const colors = {
  background: "#0B0F0D",
  surface: "#12211A",
  surfaceAlt: "#16281F",
  border: "#1F3A2C",
  textPrimary: "#EAF7EF",
  textSecondary: "#8FB3A0",
  textMuted: "#5C7A6B",
  bullish: "#22D97B",
  bullishMuted: "#134B33",
  bearish: "#FF5C5C",
  bearishMuted: "#4A1E1E",
  neutral: "#E8C547",
  neutralMuted: "#4A3E12",
  accent: "#22D97B",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export function flagColor(flag: "bullish" | "bearish" | "neutral") {
  switch (flag) {
    case "bullish":
      return colors.bullish;
    case "bearish":
      return colors.bearish;
    default:
      return colors.neutral;
  }
}
