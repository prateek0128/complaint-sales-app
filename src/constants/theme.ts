export const colors = {
  background: "#12121A", // Deeper, more premium dark
  panel: "#1E1E28",      // Slightly elevated
  panelAlt: "#2A2A38",   // Higher elevation
  primary: "#6366F1",    // Indigo primary brand color
  primaryLight: "#818CF8",
  primaryDark: "#4338CA",
  text: "#F8FAFC",       // Off-white text for less eye strain
  textSecondary: "#94A3B8", // Muted text
  muted: "#64748B",
  border: "rgba(255,255,255,0.08)",
  success: "#10B981",    // Emerald green
  error: "#EF4444",      // Red
  warning: "#F59E0B",    // Amber
  info: "#3B82F6",       // Blue
  black: "#000000",
  white: "#FFFFFF",
  transparent: "transparent",
  red: "#EF4444",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  heading1: { fontSize: 32, fontWeight: "700" as const, color: colors.text },
  heading2: { fontSize: 24, fontWeight: "700" as const, color: colors.text },
  heading3: { fontSize: 20, fontWeight: "600" as const, color: colors.text },
  body1: { fontSize: 16, fontWeight: "400" as const, color: colors.text },
  body2: { fontSize: 14, fontWeight: "400" as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: "400" as const, color: colors.muted },
  button: { fontSize: 16, fontWeight: "600" as const, color: colors.white },
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};
