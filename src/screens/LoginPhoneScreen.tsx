import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { loginWithPhone } from "../api/api";
import { AppButton, Field, Screen } from "../components/ui";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "LoginPhone">;

export default function LoginPhoneScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert("Alert", "Enter a valid mobile number.");
      return;
    }
    setLoading(true);
    try {
      await loginWithPhone(phoneNumber);
      Alert.alert("OTP sent", "Continue with the OTP flow from your backend response.");
      navigation.navigate("LoginUserId");
    } catch {
      Alert.alert("Unable to send OTP", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Login with Phone</Text>
        <Field label="Mobile Number" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Enter mobile number" keyboardType="number-pad" maxLength={10} />
        <AppButton title="Send OTP" loading={loading} onPress={submit} />
      </ScrollView>
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
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 24,
    textAlign: "center"
  }
});
