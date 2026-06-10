import { ReactNode } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography, shadows } from "../constants/theme";

export function Screen({ children, style }: { children: ReactNode; style?: any }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function AppButton({
  title,
  onPress,
  loading,
  icon,
  variant = "primary",
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "secondary" | "outline" | "danger";
  style?: any;
}) {
  const getButtonStyle = () => {
    switch (variant) {
      case "secondary": return styles.buttonSecondary;
      case "outline": return styles.buttonOutline;
      case "danger": return styles.buttonDanger;
      case "primary":
      default: return styles.buttonPrimary;
    }
  };

  const getTextColor = () => {
    if (variant === "outline") return colors.primaryLight;
    return colors.white;
  };

  return (
    <Pressable 
      style={({ pressed }) => [styles.buttonBase, getButtonStyle(), pressed && styles.pressed, style]} 
      onPress={onPress} 
      disabled={loading}
    >
      {loading ? <ActivityIndicator color={getTextColor()} /> : icon ? <Ionicons name={icon} color={getTextColor()} size={20} /> : null}
      <Text style={[styles.buttonText, { color: getTextColor() }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: any }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: any; onPress?: () => void }) {
  const Container = onPress ? Pressable : View;
  return (
    <Container 
      style={({ pressed }: any) => [styles.card, pressed && onPress && styles.pressed, style]} 
      onPress={onPress}
    >
      {children}
    </Container>
  );
}

export function Avatar({ uri, size = 72 }: { uri?: string; size?: number }) {
  const source = uri ? { uri } : require("../../assets/maleAvatar.jpeg");
  return <Image source={source} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.panelAlt }} />;
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  panel: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  fieldWrap: {
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  label: {
    ...typography.body2,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.panelAlt,
    ...typography.body1,
  },
  buttonBase: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonOutline: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonText: {
    ...typography.button,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }]
  }
});
