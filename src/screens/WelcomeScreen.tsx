import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/ui";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <ImageBackground source={require("../../assets/frameBg.png")} resizeMode="cover" style={styles.root}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>Quick Complaint</Text>
        <Text style={styles.copy}>Register service complaints, track technician visits, and manage updates from one place.</Text>
        <AppButton title="Login with User ID" icon="log-in-outline" onPress={() => navigation.navigate("LoginUserId")} />
        <AppButton title="Login with Phone" icon="call-outline" onPress={() => navigation.navigate("LoginPhone")} />
        <AppButton title="New Registration" icon="person-add-outline" onPress={() => navigation.navigate("Registration")} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end"
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.58)"
  },
  content: {
    gap: 14,
    padding: 20,
    paddingBottom: 44
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900"
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 8
  }
});
