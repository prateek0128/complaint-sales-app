import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { registerCustomer, UploadImage } from "../api/api";
import { AppButton, Field, Screen } from "../components/ui";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";
import { customerAddedNotification } from "../utils/notifications";

type Props = NativeStackScreenProps<RootStackParamList, "Registration">;

function toUpload(uri: string, name: string): UploadImage {
  return { uri, name, type: "image/jpeg" };
}

export default function RegistrationScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState<UploadImage | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
    if (!result.canceled) setProfileImage(toUpload(result.assets[0].uri, "profile.jpg"));
  };

  const submit = async () => {
    if (!firstName || !contact || !location) {
      Alert.alert("Alert", "Name, contact, and location are required.");
      return;
    }
    setLoading(true);
    try {
      await registerCustomer({ firstName, lastName, email, gender, contact, location, profileImage });
      await customerAddedNotification(`${firstName.trim()} ${lastName.trim()}`.trim());
      Alert.alert("Registered", "Customer registration completed.");
      navigation.replace("LoginUserId");
    } catch {
      Alert.alert("Registration failed", "Unable to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New Registration</Text>
        <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="Enter first name" />
        <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Enter last name" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" />
        <Field label="Gender" value={gender} onChangeText={setGender} placeholder="Male / Female" />
        <Field label="Contact" value={contact} onChangeText={setContact} placeholder="Enter contact" keyboardType="number-pad" maxLength={10} />
        <Field label="Location" value={location} onChangeText={setLocation} placeholder="Enter address" multiline />
        <View style={styles.previewRow}>
          {profileImage ? <Image source={{ uri: profileImage.uri }} style={styles.preview} /> : null}
          <AppButton title="Choose Profile Image" icon="image-outline" onPress={pickImage} />
        </View>
        <AppButton title="Register" loading={loading} onPress={submit} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 22,
    marginTop: 20
  },
  previewRow: {
    gap: 14,
    marginBottom: 20
  },
  preview: {
    width: 96,
    height: 96,
    borderRadius: 48
  }
});
