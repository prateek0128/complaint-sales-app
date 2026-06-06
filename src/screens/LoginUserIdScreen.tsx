import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, Field, Screen } from "../components/ui";
import { loginWithUserId, getInfo } from "../api/api";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";
import { pickObject } from "../utils/data";
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
      const body = pickObject<Record<string, unknown>>(response.data);
      const userId = Number(body.id ?? body.userId ?? body.customerId ?? body.technicianId ?? 0);
      const accountType = Number(body.accountType ?? body.type ?? 0);
      const token = String(body.token ?? body.accessToken ?? "");
      await storage.setUserId(userId);
      await storage.setAccountType(accountType);
      await storage.setPhoneNumber(phoneNumber);
      await storage.setToken(token);
      if (userId) {
        const info = await getInfo(userId, accountType, phoneNumber);
        const details = pickObject<Record<string, unknown>>(info.data);
        await storage.setInfoName(String(details.name ?? `${details.firstName ?? ""} ${details.lastName ?? ""}`.trim()));
        await storage.setInfoEmail(String(details.email ?? ""));
        await storage.setInfoNumber(String(details.contact ?? details.phoneNumber ?? phoneNumber));
        await storage.setInfoAddress(String(details.location ?? details.address ?? ""));
        await storage.setInfoProfile(String(details.profileImage ?? details.profilePicture ?? ""));
      }
      navigation.replace("Dashboard");
    } catch (error) {
      Alert.alert("Login failed", "Unable to login. Please check details and try again.");
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
