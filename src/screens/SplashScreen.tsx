import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";
import { storage } from "../utils/storage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      const userId = await storage.getUserId();
      navigation.replace(userId ? "Dashboard" : "Welcome");
    }, 900);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.root}>
      <Image source={require("../../assets/frameSplash.png")} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Maheshwari Infotech</Text>
      <Text style={styles.subtitle}>Complaint Service</Text>
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
  }
});
