import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, Field, Screen } from "../components/ui";
import { loginWithUserId, getInfo } from "../api/api";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";
import { storage } from "../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "LoginUserId">;

export default function LoginUserIdScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
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
      }
      navigation.replace("Dashboard");
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Log in using your registered mobile number.</Text>
          <Field label="User ID" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Enter mobile number" keyboardType="number-pad" maxLength={10} />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry />
          <AppButton title="Continue" loading={loading} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center"
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 34
  }
});
