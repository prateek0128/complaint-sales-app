import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { submitFeedback } from "../api/api";
import { AppButton, Field, Screen } from "../components/ui";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Feedback">;

export default function FeedbackScreen({ route, navigation }: Props) {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await submitFeedback(rating, message, Number(route.params?.technicianId ?? 0), Number(route.params?.complaintId ?? 0));
      Alert.alert("Thank you", "Feedback submitted.");
      navigation.replace("Dashboard");
    } catch {
      Alert.alert("Error", "Unable to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Feedback</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(value => (
          <Pressable key={value} onPress={() => setRating(value)}>
            <Ionicons name={value <= rating ? "star" : "star-outline"} color="#facc15" size={38} />
          </Pressable>
        ))}
      </View>
      <Field label="Message" value={message} onChangeText={setMessage} placeholder="Write feedback" multiline />
      <AppButton title="Submit Feedback" loading={loading} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 30
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 28
  }
});
