import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Splash from "expo-splash-screen";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, typography } from "../constants/theme";
import { storage } from "../utils/storage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  useEffect(() => {
    void Splash.hideAsync();

    const navigateNext = async () => {
      const userId = await storage.getUserId();
      navigation.replace(userId ? "Dashboard" : "Welcome");
    };

    const run = async () => {
      try {
        if (!__DEV__) {
          setUpdateStatus("Checking for updates...");
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            setUpdateStatus("Downloading update...");
            await Updates.fetchUpdateAsync();
            setUpdateStatus("Update ready! Restarting...");
            await Updates.reloadAsync();
            return;
          }
        }
      } catch (updateError) {
        console.log("Update check failed:", updateError);
        setUpdateStatus("Preparing your experience...");
      }

      setUpdateStatus(null);
      await navigateNext();
    };

    const timer = setTimeout(() => {
      void run();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.root}>
      <View style={styles.logoShell}>
        <Image source={require("../../assets/frameSplash.png")} style={styles.logo} resizeMode="contain" />
      </View>
      <Text style={styles.title}>Maheshwari Infotech</Text>
      <Text style={styles.subtitle}>Complaint Service</Text>
      <View style={styles.statusRow}>
        <ActivityIndicator color={colors.primaryLight} size="small" />
        <Text style={styles.status}>{updateStatus ?? "Preparing your workspace..."}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.lg
  },
  logoShell: {
    width: 190,
    height: 190,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  logo: {
    width: 150,
    height: 150
  },
  title: {
    ...typography.heading1,
    marginTop: spacing.lg,
    textAlign: "center"
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  status: {
    ...typography.caption,
    color: colors.primaryLight,
  }
});
