import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, Field, Screen } from "../components/ui";
import { loginWithUserId, getInfo } from "../api/api";
import { colors, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";
import { storage } from "../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "LoginUserId">;

export default function LoginUserIdScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (phoneNumber.length < 10 || !password) {
      Alert.alert("Alert", "Enter registered mobile number and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await loginWithUserId(phoneNumber, password);
      const body = response.data as Record<string, unknown>;

      // Mirrors Flutter loginWithUserID check: message === 'Login successful!'
      if (body.message !== "Login successful!") {
        Alert.alert("Failed", "Your Number is not Registered");
        return;
      }

      const userId = Number(body.userId ?? 0);
      const accountType = Number(body.accountType ?? 0);
      const token = String(body.token ?? "");
      const savedPhone = String(body.phoneNumber ?? phoneNumber);

      await storage.setUserId(userId);
      await storage.setAccountType(accountType);
      await storage.setPhoneNumber(savedPhone);
      await storage.setToken(token);
      if (userId) {
        const info = await getInfo(userId, accountType, phoneNumber);
        const infoBody = info.data as Record<string, unknown>;
        const details = Array.isArray(infoBody.Details)
          ? (infoBody.Details[0] as Record<string, unknown>)
          : {};
        await storage.setInfoName(`${details.First_Name ?? ""} ${details.Last_Name ?? ""}`.trim());
        await storage.setInfoEmail(String(details.Email ?? ""));
        await storage.setInfoNumber(String(details.Contact ?? phoneNumber));
        await storage.setInfoAddress(String(details.Location ?? ""));
        await storage.setInfoProfile(String(details.Profile_Picture ?? ""));
        await storage.setSubscribeToken(String(details.SubscribeToken ?? ""));
        await storage.setAdminToken(String(details.AdminToken ?? ""));
      }
      navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      });

    } catch (err) {
      const serverMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Error", serverMessage ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in using your registered mobile number and password.</Text>
          </View>
          
          <View style={styles.form}>
            <Field 
              label="User ID" 
              value={phoneNumber} 
              onChangeText={setPhoneNumber} 
              placeholder="Enter mobile number" 
              keyboardType="number-pad" 
              maxLength={10} 
            />
            <Field 
              label="Password" 
              value={password} 
              onChangeText={setPassword} 
              placeholder="Enter password" 
              secureTextEntry={!passwordVisible}
              rightIcon={passwordVisible ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setPasswordVisible(value => !value)}
            />
            <AppButton 
              title="Sign In" 
              icon="log-in-outline" 
              loading={loading} 
              onPress={submit} 
              style={styles.submitBtn} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.heading1,
    color: colors.primaryLight,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  form: {
    backgroundColor: colors.panel,
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitBtn: {
    marginTop: spacing.md,
  }
});
