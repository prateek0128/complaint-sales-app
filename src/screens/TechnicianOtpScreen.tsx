import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { resolveComplaint } from "../api/api";
import { AppButton, Field, Screen } from "../components/ui";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";
import { complaintResolvedNotifications } from "../utils/notifications";

type Props = NativeStackScreenProps<RootStackParamList, "TechnicianOtp">;

export default function TechnicianOtpScreen({ route, navigation }: Props) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await resolveComplaint(Number(route.params.technicianId), Number(route.params.complaintId), Number(otp));
      await complaintResolvedNotifications(route.params.complaintId, route.params.subscribeToken);
      Alert.alert("Resolved", "Complaint resolved successfully.");
      navigation.replace("Dashboard");
    } catch {
      Alert.alert("Error", "Unable to resolve complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Technician OTP</Text>
      <Field label="OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} placeholder="Enter OTP" />
      <AppButton title="Resolve Complaint" loading={loading} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginVertical: 24,
    textAlign: "center"
  }
});
