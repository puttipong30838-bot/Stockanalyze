export const colors = {
  background: "#000000",
  surface: "#0D1117",
  surfaceAlt: "#161B22",
  border: "#242B36",
  textPrimary: "#E6EDF3",
  textSecondary: "#8B98A5",
  textMuted: "#57606A",
  // Brand/interactive accent -- distinct from bullish/bearish so buttons,
  // active states, and loading spinners don't all read as "price is up".
  accent: "#2DD4BF",
  accentMuted: "#0F3B36",
  accentStrong: "#5EEAD4",
  // Reserved strictly for price-direction semantics (candles, % change,
  // buy/sell recommendation, sentiment).
  bullish: "#22D97B",
  bullishMuted: "#134B33",
  bullishStrong: "#3BFF97",
  bearish: "#FF5C5C",
  bearishMuted: "#4A1E1E",
  bearishStrong: "#FF2E2E",
  neutral: "#E8C547",
  neutralMuted: "#4A3E12",
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
