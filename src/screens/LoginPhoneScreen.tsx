import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, AppHeader, Panel, Screen } from "../components/ui";
import { colors, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "LoginPhone">;

export default function LoginPhoneScreen({ navigation }: Props) {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader
          centered
          title="Phone Login"
          subtitle="Use secure phone verification to access your service dashboard."
        />
        <Panel style={styles.panel}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" color={colors.primaryLight} size={34} />
          </View>
          <Text style={styles.info}>A secure phone sign-in page will open for verification.</Text>
          <AppButton title="Sign In with Phone" icon="call" onPress={() => navigation.navigate("PhoneSignIn")} />
        </Panel>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  panel: {
    width: "100%",
    alignItems: "center",
    gap: spacing.md,
  },
  info: {
    ...typography.body2,
    textAlign: "center",
    color: colors.textSecondary,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.16)",
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.26)",
  },
});
