import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, Card, Screen } from "../components/ui";
import { colors, radius, spacing, typography } from "../constants/theme";
import type { DashboardTabParamList, RootStackParamList } from "../navigation/types";
import { storage } from "../utils/storage";

type Props = CompositeScreenProps<BottomTabScreenProps<DashboardTabParamList, "Profile">, NativeStackScreenProps<RootStackParamList>>;

export default function ProfileScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState("");

  useEffect(() => {
    void (async () => {
      setName(await storage.getInfoName());
      setEmail(await storage.getInfoEmail());
      setProfile(await storage.getInfoProfile());
    })();
  }, []);

  const logout = async () => {
    await storage.clearAll();
    navigation.replace("Welcome");
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profile}>
          <Avatar uri={profile} size={100} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{name || "User"}</Text>
            <Text style={styles.email}>{email || "No email provided"}</Text>
          </View>
        </View>
        
        <Card>
          <View style={styles.panelHeader}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primaryLight} />
            <Text style={styles.panelTitle}>About App</Text>
          </View>
          <Text style={styles.copy}>Maheshwari Infotech Complaint App</Text>
          <Text style={styles.muted}>This app helps customers register complaints, track technician visits, and receive service updates.</Text>
          <Text style={styles.version}>Version: 1.0.0</Text>
        </Card>
        
        <Card>
          <View style={styles.panelHeader}>
            <Ionicons name="help-buoy-outline" size={24} color={colors.primaryLight} />
            <Text style={styles.panelTitle}>Help & Support</Text>
          </View>
          <Pressable style={styles.contactRow} onPress={() => Linking.openURL("tel:+917409548907")}>
            <Ionicons name="call" size={20} color={colors.success} />
            <Text style={styles.link}>Contact Us: +91 7409548907</Text>
          </Pressable>
        </Card>
        
        <Pressable style={({ pressed }) => [styles.logout, pressed && styles.pressed]} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  profile: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  profileInfo: {
    alignItems: "center",
    gap: 4,
  },
  name: {
    ...typography.heading2,
    color: colors.text,
  },
  email: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  panelTitle: {
    ...typography.heading3,
    color: colors.primaryLight,
  },
  copy: {
    ...typography.body1,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  muted: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  version: {
    ...typography.caption,
    color: colors.muted,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  link: {
    ...typography.body1,
    color: colors.success,
    fontWeight: "700",
  },
  logout: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  logoutText: {
    ...typography.button,
    color: colors.error,
  },
  pressed: {
    opacity: 0.8,
  }
});
