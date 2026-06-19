import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { registerCustomer, UploadImage } from "../api/api";
import { AppButton, AppHeader, Field, IconButton, Panel, Screen, useAppAlert } from "../components/ui";
import { colors, radius, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";
import { customerAddedNotification } from "../utils/notifications";

type Props = NativeStackScreenProps<RootStackParamList, "Registration">;

function toUpload(uri: string, name: string): UploadImage {
  return { uri, name, type: "image/jpeg" };
}

export default function RegistrationScreen({ navigation }: Props) {
  const alert = useAppAlert();
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
      alert.show("Alert", "Name, contact, and location are required.");
      return;
    }
    setLoading(true);
    try {
      await registerCustomer({ firstName, lastName, email, gender, contact, location, profileImage });
      await customerAddedNotification(`${firstName.trim()} ${lastName.trim()}`.trim());
      alert.show("Registered", "Customer registration completed.", [
        { text: "Continue", onPress: () => navigation.replace("LoginUserId") }
      ]);
    } catch {
      alert.show("Registration failed", "Unable to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <AppHeader
            title="Create Account"
            subtitle="Register your profile to raise and track service complaints."
            left={<IconButton icon="chevron-back" variant="soft" onPress={() => navigation.goBack()} />}
          />
          <Panel style={styles.form}>
            <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="Enter first name" />
            <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Enter last name" />
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" />
            <Field label="Gender" value={gender} onChangeText={setGender} placeholder="Male / Female" />
            <Field label="Contact" value={contact} onChangeText={setContact} placeholder="Enter contact" keyboardType="number-pad" maxLength={10} />
            <Field label="Location" value={location} onChangeText={setLocation} placeholder="Enter address" multiline />
            <View style={styles.previewRow}>
              {profileImage ? <Image source={{ uri: profileImage.uri }} style={styles.preview} /> : <View style={styles.previewPlaceholder}><Text style={styles.previewPlaceholderText}>Photo</Text></View>}
              <AppButton title={profileImage ? "Change Profile Image" : "Choose Profile Image"} icon="image-outline" variant="secondary" onPress={pickImage} style={{ flex: 1 }} />
            </View>
            <AppButton title="Register" loading={loading} onPress={submit} />
          </Panel>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingVertical: spacing.lg,
  },
  form: {
    padding: spacing.lg,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewPlaceholderText: {
    ...typography.caption,
    color: colors.muted,
  }
});
