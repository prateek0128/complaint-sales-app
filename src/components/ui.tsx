import { Ionicons } from "@expo/vector-icons";
import { createContext, ReactNode, useContext, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadows, spacing, typography } from "../constants/theme";

type IconName = keyof typeof Ionicons.glyphMap;
type AppAlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};
type AppAlertState = {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
};
type AppAlertContextValue = {
  show: (title: string, message?: string, buttons?: AppAlertButton[]) => void;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function AppAlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AppAlertState | null>(null);

  const show = (title: string, message?: string, buttons?: AppAlertButton[]) => {
    setAlert({
      title,
      message,
      buttons: buttons?.length ? buttons : [{ text: "OK" }],
    });
  };

  const close = (button?: AppAlertButton) => {
    setAlert(null);
    if (button?.onPress) {
      setTimeout(button.onPress, 120);
    }
  };

  const iconName =
    alert?.buttons.some(button => button.style === "destructive") ? "warning-outline" :
    /success|submitted|registered|resolved|thank|sent|cancelled/i.test(alert?.title ?? "") ? "checkmark-circle-outline" :
    /error|failed|invalid|cannot/i.test(alert?.title ?? "") ? "alert-circle-outline" :
    "sparkles-outline";

  const iconColor =
    iconName === "checkmark-circle-outline" ? colors.success :
    iconName === "alert-circle-outline" || iconName === "warning-outline" ? colors.error :
    colors.primaryLight;

  return (
    <AppAlertContext.Provider value={{ show }}>
      {children}
      <Modal transparent visible={Boolean(alert)} animationType="fade" statusBarTranslucent onRequestClose={() => close()}>
        <View style={styles.alertOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close(alert?.buttons.find(button => button.style === "cancel"))} />
          <View style={styles.alertCard}>
            <View style={[styles.alertIcon, { backgroundColor: `${iconColor}1F`, borderColor: `${iconColor}4D` }]}>
              <Ionicons name={iconName} color={iconColor} size={28} />
            </View>
            <AppText variant="h2" style={styles.centerText}>{alert?.title}</AppText>
            {alert?.message ? <AppText variant="body2" muted style={[styles.centerText, styles.alertMessage]}>{alert.message}</AppText> : null}
            <View style={[styles.alertActions, (alert?.buttons.length ?? 0) > 1 && styles.alertActionsRow]}>
              {alert?.buttons.map((button, index) => {
                const isCancel = button.style === "cancel";
                const isDanger = button.style === "destructive";
                return (
                  <Pressable
                    key={`${button.text}-${index}`}
                    accessibilityRole="button"
                    onPress={() => close(button)}
                    style={({ pressed }) => [
                      styles.alertButton,
                      isCancel && styles.alertButtonCancel,
                      isDanger && styles.alertButtonDanger,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.alertButtonText, isCancel && styles.alertButtonTextCancel]}>{button.text}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const value = useContext(AppAlertContext);
  if (!value) {
    throw new Error("useAppAlert must be used inside AppAlertProvider");
  }
  return value;
}

export function AppScreen({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <SafeAreaView style={[styles.screen, padded && styles.screenPadded, style]}>{children}</SafeAreaView>;
}

export function Screen(props: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <AppScreen {...props} />;
}

export function AppText({
  children,
  variant = "body",
  muted,
  style,
  ...props
}: TextProps & {
  children: ReactNode;
  variant?: "display" | "h1" | "h2" | "h3" | "body" | "body2" | "caption";
  muted?: boolean;
}) {
  const variantStyle =
    variant === "display" ? typography.display :
    variant === "h1" ? typography.heading1 :
    variant === "h2" ? typography.heading2 :
    variant === "h3" ? typography.heading3 :
    variant === "body2" ? typography.body2 :
    variant === "caption" ? typography.caption :
    typography.body1;

  return (
    <Text {...props} style={[variantStyle, muted && styles.textMuted, style]}>
      {children}
    </Text>
  );
}

export function AppHeader({
  title,
  subtitle,
  left,
  right,
  centered = false,
  style
}: {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  centered?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.header, centered && styles.headerCentered, style]}>
      {left ? <View style={styles.headerSide}>{left}</View> : null}
      <View style={[styles.headerText, centered && styles.headerTextCentered]}>
        <AppText variant="h1" style={centered && styles.centerText}>{title}</AppText>
        {subtitle ? <AppText variant="body2" muted style={[styles.headerSubtitle, centered && styles.centerText]}>{subtitle}</AppText> : null}
      </View>
      {right ? <View style={styles.headerSide}>{right}</View> : left ? <View style={styles.headerSide} /> : null}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  variant = "ghost",
  disabled,
  color,
}: {
  icon: IconName;
  onPress?: () => void;
  variant?: "ghost" | "soft" | "danger";
  disabled?: boolean;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        variant === "soft" && styles.iconButtonSoft,
        variant === "danger" && styles.iconButtonDanger,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Ionicons name={icon} color={color ?? (variant === "danger" ? colors.error : colors.text)} size={20} />
    </Pressable>
  );
}

export function AppButton({
  title,
  onPress,
  loading,
  disabled,
  icon,
  variant = "primary",
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  style?: StyleProp<ViewStyle>;
}) {
  const getButtonStyle = () => {
    switch (variant) {
      case "secondary": return styles.buttonSecondary;
      case "outline": return styles.buttonOutline;
      case "danger": return styles.buttonDanger;
      case "ghost": return styles.buttonGhost;
      case "primary":
      default: return styles.buttonPrimary;
    }
  };

  const getTextColor = () => {
    if (variant === "outline" || variant === "ghost") return colors.primaryLight;
    if (variant === "secondary") return colors.text;
    return colors.white;
  };

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.buttonBase, getButtonStyle(), (loading || disabled) && styles.buttonDisabled, pressed && !(loading || disabled) && styles.pressed, style]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? <ActivityIndicator color={getTextColor()} /> : icon ? <Ionicons name={icon} color={getTextColor()} size={20} /> : null}
      <Text style={[styles.buttonText, { color: getTextColor() }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: TextInputProps & {
  label: string;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={colors.subtle}
          selectionColor={colors.primaryLight}
          style={[styles.input, props.multiline && styles.inputMultiline, rightIcon && styles.inputWithIcon, style]}
          autoCapitalize="none"
          {...props}
        />
        {rightIcon ? (
          <Pressable style={styles.inputIconButton} onPress={onRightIconPress} hitSlop={10}>
            <Ionicons name={rightIcon} color={colors.textSecondary} size={22} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function AppCard({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
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

export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Card(props: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  return <AppCard {...props} />;
}

export function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <AppText variant="h3">{title}</AppText>
        {subtitle ? <AppText variant="caption" muted style={styles.sectionSubtitle}>{subtitle}</AppText> : null}
      </View>
      {right}
    </View>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  message = "Pull to refresh or check back soon.",
  icon = "file-tray-outline"
}: {
  title?: string;
  message?: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.stateBox}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} color={colors.primaryLight} size={26} />
      </View>
      <AppText variant="h3" style={styles.centerText}>{title}</AppText>
      <AppText variant="body2" muted style={[styles.centerText, styles.stateMessage]}>{message}</AppText>
    </View>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={colors.primaryLight} size="large" />
      <AppText variant="body2" muted style={styles.stateMessage}>{label}</AppText>
    </View>
  );
}

export function ErrorState({ title = "Something went wrong", message }: { title?: string; message?: string }) {
  return <EmptyState icon="warning-outline" title={title} message={message ?? "Please try again."} />;
}

export function ListItem({
  title,
  subtitle,
  icon,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}>
      {icon ? <View style={styles.listIcon}><Ionicons name={icon} color={colors.primaryLight} size={20} /></View> : null}
      <View style={{ flex: 1 }}>
        <AppText variant="body" style={styles.listTitle}>{title}</AppText>
        {subtitle ? <AppText variant="caption" muted>{subtitle}</AppText> : null}
      </View>
      {right}
    </Pressable>
  );
}

export function Avatar({ uri, size = 72, gender }: { uri?: string; size?: number; gender?: string }) {
  const normalizedGender = String(gender ?? "").trim().toLowerCase();
  const fallbackSource = normalizedGender.startsWith("f")
    ? require("../../assets/femaleAvatar.jpeg")
    : require("../../assets/maleAvatar.jpeg");
  const source = uri ? { uri } : fallbackSource;
  return <Image source={source} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.panelAlt, borderWidth: 2, borderColor: colors.borderStrong }} />;
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPadded: {
    paddingHorizontal: spacing.md,
  },
  textMuted: {
    color: colors.muted,
  },
  centerText: {
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerCentered: {
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerTextCentered: {
    alignItems: "center",
  },
  headerSide: {
    width: 44,
    alignItems: "center",
  },
  headerSubtitle: {
    marginTop: spacing.xs,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonSoft: {
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonDanger: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.28)",
  },
  panel: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
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
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrap: {
    position: "relative",
  },
  input: {
    ...typography.body1,
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.panelAlt,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  inputIconButton: {
    position: "absolute",
    right: spacing.sm,
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonBase: {
    minHeight: 54,
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
  buttonGhost: {
    backgroundColor: colors.transparent,
  },
  buttonDisabled: {
    opacity: 0.48,
  },
  buttonText: {
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    fontWeight: typography.button.fontWeight,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    marginTop: 2,
  },
  stateBox: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  stateIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.14)",
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.18)",
    marginBottom: spacing.xs,
  },
  stateMessage: {
    marginTop: spacing.xs,
  },
  alertOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,6,23,0.72)",
    padding: spacing.lg,
  },
  alertCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  alertIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  alertMessage: {
    marginTop: spacing.sm,
  },
  alertActions: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  alertActionsRow: {
    flexDirection: "row",
  },
  alertButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.ms,
  },
  alertButtonCancel: {
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertButtonDanger: {
    backgroundColor: colors.error,
  },
  alertButtonText: {
    ...typography.button,
    color: colors.white,
  },
  alertButtonTextCancel: {
    color: colors.text,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  listIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panelAlt,
  },
  listTitle: {
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  }
});
