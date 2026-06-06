import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../components/ui";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "LoginPhone">;

export default function LoginPhoneScreen({ navigation }: Props) {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Login with Phone</Text>
        <Text style={styles.info}>Tap below to sign in securely using your phone number.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("PhoneSignIn")}>
          <Text style={styles.buttonLabel}>Sign In with Phone Number</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center"
  },
  info: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32
  },
  button: {
    backgroundColor: colors.red,
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "100%"
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  }
});
