import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchItemCategories, raiseComplaint, UploadImage } from "../api/api";
import { AppButton, Field, Screen } from "../components/ui";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";
import { storage } from "../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "RaiseComplaint">;

const asUpload = (uri: string, name: string): UploadImage => ({ uri, name, type: "image/jpeg" });

export default function RaiseComplaintScreen({ navigation }: Props) {
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

  const pickImage = async (target: "item" | "bill") => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
    if (result.canceled) return;
    const image = asUpload(result.assets[0].uri, `${target}.jpg`);
    if (target === "item") setItemImage(image);
    else setBillImage(image);
  };

  const submit = async () => {
    if (!customerName || !description || !item || !contact || !address || !itemImage) {
      Alert.alert("Alert", "Name, description, item type, contact, address, and item image are required.");
      return;
    }
    if (warranty && !billImage) {
      Alert.alert("Alert", "Please attach bill image for warranty complaint.");
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
      Alert.alert("Submitted", "Complaint submitted successfully.");
      navigation.replace("Dashboard");
    } catch {
      Alert.alert("Error", "Unable to submit complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>ADD COMPLAINT</Text>
        <Field label="Name" value={customerName} onChangeText={setCustomerName} placeholder="Enter your name" />
        <Field label="Complaint Description" value={description} onChangeText={setDescription} placeholder="Enter complaint description" multiline />
        <Field label="Address" value={address} onChangeText={setAddress} placeholder="Enter address" multiline />
        <Field label="Contact" value={contact} onChangeText={setContact} placeholder="Enter contact" keyboardType="number-pad" maxLength={10} />
        <Field label="Item Type" value={item} onChangeText={setItem} placeholder="Enter item type" />
        {items.length ? (
          <View style={styles.chips}>
            {items.map(value => (
              <Pressable key={value} style={styles.chip} onPress={() => setItem(value)}>
                <Text style={styles.chipText}>{value}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <ImagePickerButton title="Attach Item Image" image={itemImage} onPress={() => pickImage("item")} />
        <Pressable style={styles.warranty} onPress={() => setWarranty(value => !value)}>
          <Text style={styles.warrantyText}>Product in Warranty?</Text>
          <Text style={styles.warrantyText}>{warranty ? "Yes" : "No"}</Text>
        </Pressable>
        {warranty ? <ImagePickerButton title="Attach Bill Receipt" image={billImage} onPress={() => pickImage("bill")} /> : null}
        <AppButton title="Submit Complaint" loading={loading} onPress={submit} />
      </ScrollView>
    </Screen>
  );
}

function ImagePickerButton({ title, image, onPress }: { title: string; image: UploadImage | null; onPress: () => void }) {
  return (
    <View style={styles.imageRow}>
      {image ? <Image source={{ uri: image.uri }} style={styles.preview} /> : null}
      <AppButton title={title} icon="camera-outline" onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginVertical: 14
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.black
  },
  chipText: {
    color: colors.text,
    fontSize: 12
  },
  imageRow: {
    gap: 12,
    marginBottom: 18
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 8
  },
  warranty: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.panel,
    marginBottom: 18
  },
  warrantyText: {
    color: colors.text,
    fontWeight: "800"
  }
});
