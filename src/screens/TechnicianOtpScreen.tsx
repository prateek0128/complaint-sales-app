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
  const isOtpValid = otp.trim().length === 4;

  const submit = async () => {
    if (!isOtpValid) {
      Alert.alert("Invalid OTP", "Please enter a valid 4 digit OTP.");
      return;
    }
    
    setLoading(true);
    try {
      console.log('Resolving complaint with:');
      console.log('- Technician ID:', route.params.technicianId);
      console.log('- Complaint ID:', route.params.complaintId);
      console.log('- OTP:', otp);
      console.log('- Customer subscribeToken:', route.params.subscribeToken);
      
      await resolveComplaint(Number(route.params.technicianId), Number(route.params.complaintId), Number(otp));
      
      // Send notification to customer
      console.log('Sending notification to customer...');
      await complaintResolvedNotifications(route.params.complaintId, route.params.subscribeToken);
      
      Alert.alert("Resolved", "Complaint resolved successfully. Customer has been notified.");
      navigation.replace("Dashboard");
    } catch (error) {
      console.error('Error resolving complaint:', error);
      const errorMessage = (error as any)?.response?.data?.message || "Unable to resolve complaint. Please check the OTP and try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Technician OTP</Text>
      <Field label="OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={4} placeholder="Enter OTP" />
      <AppButton title="Resolve Complaint" loading={loading} onPress={submit} disabled={!isOtpValid} />
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
