import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/ui";
import { colors, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <ImageBackground source={require("../../assets/frameBg.png")} resizeMode="cover" style={styles.root}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={styles.header}>
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
    justifyContent: "flex-end"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 18, 26, 0.75)" // darker overlay matching new theme
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading1,
    color: colors.primaryLight,
  },
  subtitle: {
    ...typography.heading2,
    color: colors.white,
    marginTop: -spacing.xs,
  },
  copy: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  }
});
