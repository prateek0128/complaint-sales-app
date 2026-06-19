import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { submitFeedback } from "../api/api";
import { AppButton, AppHeader, Field, Panel, Screen, useAppAlert } from "../components/ui";
import { colors, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Feedback">;

export default function FeedbackScreen({ route, navigation }: Props) {
  const alert = useAppAlert();
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await submitFeedback(rating, message, Number(route.params?.technicianId ?? 0), Number(route.params?.complaintId ?? 0));
      alert.show("Thank you", "Feedback submitted.", [
        { text: "Done", onPress: () => navigation.replace("Dashboard") }
      ]);
    } catch {
      alert.show("Error", "Unable to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppHeader centered title="Feedback" subtitle="Tell us how the service experience went." />
        <Panel style={styles.panel}>
          <Text style={styles.ratingLabel}>{rating}.0 Rating</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(value => (
              <Pressable key={value} onPress={() => setRating(value)} hitSlop={8}>
                <Ionicons name={value <= rating ? "star" : "star-outline"} color="#FACC15" size={38} />
              </Pressable>
            ))}
          </View>
          <Field label="Message" value={message} onChangeText={setMessage} placeholder="Write feedback" multiline />
          <AppButton title="Submit Feedback" loading={loading} onPress={submit} />
        </Panel>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  panel: {
    padding: spacing.lg,
  },
  ratingLabel: {
    ...typography.heading3,
    color: colors.text,
    textAlign: "center",
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: spacing.xl
  }
});
