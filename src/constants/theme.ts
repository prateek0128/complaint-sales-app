import { Platform } from "react-native";

export const colors = {
  background: "#0B1020",
  backgroundElevated: "#10172A",
  panel: "#151D2F",
  panelAlt: "#1B2538",
  panelSoft: "#111827",
  primary: "#6366F1",
  primaryLight: "#A5B4FC",
  primaryDark: "#4338CA",
  accent: "#22D3EE",
  text: "#F8FAFC",
  textSecondary: "#CBD5E1",
  muted: "#94A3B8",
  subtle: "#64748B",
  border: "rgba(148,163,184,0.18)",
  borderStrong: "rgba(226,232,240,0.28)",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#38BDF8",
  black: "#000000",
  white: "#FFFFFF",
  transparent: "transparent",
  red: "#EF4444",
};

export const spacing = {
  xs: 4,
  sm: 8,
  ms: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fonts = {
  regular: Platform.select({ ios: "Avenir Next", android: "sans-serif", default: "System" }),
  medium: Platform.select({ ios: "Avenir Next", android: "sans-serif-medium", default: "System" }),
  semibold: Platform.select({ ios: "Avenir Next Demi Bold", android: "sans-serif-medium", default: "System" }),
  bold: Platform.select({ ios: "Avenir Next Bold", android: "sans-serif-condensed", default: "System" }),
  heavy: Platform.select({ ios: "Avenir Next Heavy", android: "sans-serif-condensed", default: "System" }),
};

export const typography = {
  display: { fontFamily: fonts.heavy, fontSize: 36, lineHeight: 42, fontWeight: "900" as const, color: colors.text },
  heading1: { fontFamily: fonts.heavy, fontSize: 30, lineHeight: 36, fontWeight: "900" as const, color: colors.text },
  heading2: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, fontWeight: "800" as const, color: colors.text },
  heading3: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, fontWeight: "800" as const, color: colors.text },
  body1: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, fontWeight: "500" as const, color: colors.text },
  body2: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, fontWeight: "500" as const, color: colors.textSecondary },
  caption: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, fontWeight: "600" as const, color: colors.muted },
  button: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, fontWeight: "800" as const, color: colors.white },
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 6,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 12,
  },
};
