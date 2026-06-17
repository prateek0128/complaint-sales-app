import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Splash from "expo-splash-screen";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";
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
      <Image source={require("../../assets/frameSplash.png")} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Maheshwari Infotech</Text>
      <Text style={styles.subtitle}>Complaint Service</Text>
      {updateStatus ? <Text style={styles.status}>{updateStatus}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24
  },
  logo: {
    width: 190,
    height: 190
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 16,
    textAlign: "center"
  },
  subtitle: {
    color: colors.muted,
    marginTop: 8,
    fontSize: 16
  },
  status: {
    color: colors.primaryLight,
    marginTop: 24,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center"
  }
});
