import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchItemCategories, raiseComplaint, UploadImage } from "../api/api";
import { AppButton, AppHeader, Field, IconButton, Panel, Screen, SectionHeader, useAppAlert } from "../components/ui";
import { colors, radius, spacing, typography } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";
import { storage } from "../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "RaiseComplaint">;

const asUpload = (uri: string, name: string): UploadImage => ({ uri, name, type: "image/jpeg" });

export default function RaiseComplaintScreen({ navigation }: Props) {
  const alert = useAppAlert();
  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [item, setItem] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [warranty, setWarranty] = useState(false);
  const [itemImage, setItemImage] = useState<UploadImage | null>(null);
  const [billImage, setBillImage] = useState<UploadImage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      setCustomerName(await storage.getInfoName());
      setAddress(await storage.getInfoAddress());
      setContact(await storage.getInfoNumber());
      try {
        const response = await fetchItemCategories();
        const raw = JSON.stringify(response.data);
        const matches = Array.from(raw.matchAll(/"subCategory"\s*:\s*"([^"]+)"/g)).map(match => match[1]);
        setItems(matches.slice(0, 20));
      } catch {
        setItems([]);
      }
    })();
  }, []);

  const setAttachment = (target: "item" | "bill", uri: string) => {
    const image = asUpload(uri, `${target}.jpg`);
    if (target === "item") setItemImage(image);
    else setBillImage(image);
  };

  const takePicture = async (target: "item" | "bill") => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert.show("Camera Permission", "Please allow camera access to click pictures.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
    });
    if (result.canceled) return;
    setAttachment(target, result.assets[0].uri);
  };

  const pickImage = async (target: "item" | "bill") => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
    if (result.canceled) return;
    setAttachment(target, result.assets[0].uri);
  };

  const chooseImageSource = (target: "item" | "bill") => {
    alert.show(
      target === "item" ? "Attach Item Image" : "Attach Bill Receipt",
      "Choose image source",
      [
        { text: "Camera", onPress: () => void takePicture(target) },
        { text: "Gallery", onPress: () => void pickImage(target) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const submit = async () => {
    if (!customerName || !description || !item || !contact || !address || !itemImage) {
      alert.show("Alert", "Name, description, item type, contact, address, and item image are required.");
      return;
    }
    if (warranty && !billImage) {
      alert.show("Alert", "Please attach bill image for warranty complaint.");
      return;
    }
    setLoading(true);
    try {
      await raiseComplaint({
        customerName,
        description,
        item,
        contact,
        address,
        warranty: warranty ? 1 : 0,
        customerId: await storage.getUserId(),
        itemImage,
        billImage
      });
      alert.show("Submitted", "Complaint submitted successfully.", [
        { text: "Done", onPress: () => navigation.replace("Dashboard") }
      ]);
    } catch {
      alert.show("Error", "Unable to submit complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <AppHeader title="New Complaint" subtitle="Fill in the details below to raise a new service request." 
          left={<IconButton icon="chevron-back" variant="soft" onPress={() => navigation.replace("Dashboard")} />}/>

          <Panel style={styles.section}>
            <SectionHeader title="Customer Details" subtitle="We will use this for service coordination." />
            <Field label="Name" value={customerName} onChangeText={setCustomerName} placeholder="Enter your name" />
            <Field label="Contact" value={contact} onChangeText={setContact} placeholder="Enter contact" keyboardType="number-pad" maxLength={10} />
            <Field label="Address" value={address} onChangeText={setAddress} placeholder="Enter address" multiline />
          </Panel>

          <Panel style={styles.section}>
            <SectionHeader title="Complaint" subtitle="Describe the item and issue clearly." />
            <Field label="Complaint Description" value={description} onChangeText={setDescription} placeholder="Enter complaint description" multiline style={[styles.textArea, { minHeight: 100, color: "white" }]} />
            
            <Field label="Item Type" value={item} onChangeText={setItem} placeholder="Select or enter item type" />
            {items.length ? (
              <View style={styles.chips}>
                {items.map(value => (
                  <Pressable key={value} style={[styles.chip, item === value && styles.chipActive]} onPress={() => setItem(value)}>
                    <Text style={[styles.chipText, item === value && styles.chipTextActive]}>{value}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </Panel>

          <Panel style={styles.section}>
            <SectionHeader title="Attachments" subtitle="Add item photos and bill when warranty applies." />
            <ImagePickerButton title="Attach Item Image" image={itemImage} onPress={() => chooseImageSource("item")} />
            
            <Pressable style={styles.warranty} onPress={() => setWarranty(value => !value)}>
              <Text style={styles.warrantyText}>Product in Warranty?</Text>
              <View style={[styles.toggle, warranty && styles.toggleActive]}>
                <Text style={styles.toggleText}>{warranty ? "YES" : "NO"}</Text>
              </View>
            </Pressable>
            
            {warranty ? <ImagePickerButton title="Attach Bill Receipt" image={billImage} onPress={() => chooseImageSource("bill")} /> : null}
          </Panel>

          <AppButton title="Submit Complaint" loading={loading} onPress={submit} style={styles.submitBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ImagePickerButton({ title, image, onPress }: { title: string; image: UploadImage | null; onPress: () => void }) {
  return (
    <View style={styles.imageRow}>
      <AppButton title={image ? "Change Image" : title} icon="camera" variant={image ? "secondary" : "outline"} onPress={onPress} style={{ flex: 1 }} />
      {image ? <Image source={{ uri: image.uri }} style={styles.preview} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxl
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: spacing.md,
  },
  textArea: {
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.panelAlt
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  imageRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center"
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warranty: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  warrantyText: {
    ...typography.body1,
    fontWeight: "600",
  },
  toggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  toggleText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "800",
  },
  submitBtn: {
    marginTop: spacing.md,
  }
});
