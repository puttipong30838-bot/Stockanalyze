import { Text as RNText, StyleSheet, type TextProps } from "react-native";
import type { ReactNode } from "react";

const THAI_REGEX = /[฀-๿]/;

function weightFamily(weight: string, isThai: boolean): string {
  const normalized = weight === "bold" ? "700" : weight;
  if (isThai) {
    if (normalized >= "800") return "NotoSansThai_800ExtraBold";
    if (normalized >= "700") return "NotoSansThai_700Bold";
    if (normalized >= "600") return "NotoSansThai_600SemiBold";
    if (normalized >= "500") return "NotoSansThai_500Medium";
    return "NotoSansThai_400Regular";
  }
  if (normalized >= "800") return "Inter_800ExtraBold";
  if (normalized >= "700") return "Inter_700Bold";
  if (normalized >= "600") return "Inter_600SemiBold";
  if (normalized >= "500") return "Inter_500Medium";
  return "Inter_400Regular";
}

function containsThai(children: ReactNode): boolean {
  if (typeof children === "string") return THAI_REGEX.test(children);
  if (Array.isArray(children)) return children.some(containsThai);
  return false;
}

/**
 * Drop-in replacement for RN's <Text> that applies the bundled Inter /
 * Noto Sans Thai fonts, picking family + weight from the existing
 * `fontWeight` style and whether the content contains Thai script.
 */
export function Text({ style, children, ...rest }: TextProps) {
  const flat = (StyleSheet.flatten(style) ?? {}) as { fontWeight?: string | number };
  const isThai = containsThai(children);
  const family = weightFamily(String(flat.fontWeight ?? "400"), isThai);

  return (
    <RNText style={[{ fontFamily: family, fontWeight: "normal" }, style]} {...rest}>
      {children}
    </RNText>
  );
}
