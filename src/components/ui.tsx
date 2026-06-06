import { ReactNode } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../constants/theme";

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function AppButton({
  title,
  onPress,
  loading,
  icon
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : icon ? <Ionicons name={icon} color="#fff" size={20} /> : null}
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#8d8d99"
        style={styles.input}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

export function Avatar({ uri, size = 72 }: { uri?: string; size?: number }) {
  const source = uri ? { uri } : require("../../assets/maleAvatar.jpeg");
  return <Image source={source} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.panelAlt }} />;
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16
  },
  panel: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14
  },
  fieldWrap: {
    gap: 8,
    marginBottom: 16
  },
  label: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    color: colors.text,
    backgroundColor: colors.black
  },
  button: {
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18
  },
  buttonText: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16
  },
  pressed: {
    opacity: 0.78
  }
});
