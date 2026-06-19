import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/ui";
import { colors, radius, shadows, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <ImageBackground
      source={require("../../assets/frameBg.png")}
      resizeMode="cover"
      style={styles.root}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Complaint Service</Text>
          <Text style={styles.title}>Maheshwari</Text>
          <Text style={styles.subtitle}>Service Portal</Text>
        </View>
        <Text style={styles.copy}>Register service complaints, track technician visits, and manage updates from one place.</Text>
        
        <View style={styles.actions}>
          <AppButton 
            title="Login with Phone" 
            icon="call" 
            variant="primary"
            onPress={() => navigation.navigate("LoginPhone")} 
          />
          <AppButton 
            title="Login with User ID" 
            icon="person" 
            variant="secondary"
            onPress={() => navigation.navigate("LoginUserId")} 
          />
          <AppButton 
            title="Create an Account" 
            icon="person-add" 
            variant="outline"
            onPress={() => navigation.navigate("Registration")} 
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.background,
  },
  backgroundImage: {
    opacity: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 16, 32, 0.42)"
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  kicker: {
    ...typography.caption,
    alignSelf: "flex-start",
    color: colors.primaryLight,
    backgroundColor: "rgba(99,102,241,0.18)",
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.24)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  title: {
    ...typography.display,
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    ...typography.heading2,
    color: colors.primaryLight,
    marginTop: -spacing.xs,
  },
  copy: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    maxWidth: 340,
  },
  actions: {
    gap: spacing.md,
    backgroundColor: "rgba(15,23,42,0.64)",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.lg,
  }
});
