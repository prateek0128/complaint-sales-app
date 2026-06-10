import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { deleteComplaint, fetchComplaintDetails, fetchAssignedTechDetails, generateInvoice } from "../api/api";
import { AppButton, Panel, Screen } from "../components/ui";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";
import { Complaint, formatDateTime, pickObject, statusColor, mapComplaint } from "../utils/data";
import { storage } from "../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "ComplaintDetails">;

export default function ComplaintDetailsScreen({ route, navigation }: Props) {
  const [complaint, setComplaint] = useState<Complaint | null>(route.params?.complaint ?? null);
  const [accountType, setAccountType] = useState(0);
  const [selectedParts, setSelectedParts] = useState<Record<string, number>>({});
  const [technicianID, setTechnicianID] = useState<number | null>(null);
  const [technicianName, setTechnicianName] = useState<string | null>(null);
  const [technicianContact, setTechnicianContact] = useState<string | null>(null);

  // Fetch complaint details
  useEffect(() => {
    void (async () => {
      setAccountType(await storage.getAccountType());
      const id = route.params?.complaintId;
      if (!id) return;
      try {
        const response = await fetchComplaintDetails(Number(id));
        const picked = pickObject<Record<string, unknown>>(response.data);
        setComplaint(previous => ({ ...previous, ...mapComplaint(picked) }));
      } catch {
        // Keep route data if detail endpoint is unavailable.
      }
    })();
  }, [route.params?.complaintId]);

  // Fetch assigned technician details when status is InProgress
  useEffect(() => {
    if (complaint?.status !== "InProgress") return;
    const id = complaint?.complaintId ?? route.params?.complaintId;
    if (!id) return;
    void (async () => {
      try {
        const techRes = await fetchAssignedTechDetails(Number(id));
        const tech = techRes.data?.TechnicicanDetails?.[0];
        if (tech) {
          setTechnicianID(tech.Technician_ID);
          setTechnicianName(`${tech.First_Name ?? ""} ${tech.Last_Name ?? ""}`.trim());
          setTechnicianContact(tech.Contact ?? null);
        }
      } catch {
        // Leave name/contact as null if endpoint is unavailable.
      }
    })();
  }, [complaint?.status, complaint?.complaintId, route.params?.complaintId]);

  const complaintId = complaint?.complaintId ?? route.params?.complaintId ?? "NA";
  const created = formatDateTime(complaint?.createdAt);
  const products = useMemo(() => complaint?.productsAssigned ?? [], [complaint?.productsAssigned]);

  const cancel = () => {
    Alert.alert("Delete Complaint", "Are you sure you want to cancel this complaint?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteComplaint(Number(complaintId));
          navigation.replace("Dashboard");
        }
      }
    ]);
  };

  const createInvoice = async () => {
    const repairParts = Object.entries(selectedParts).map(([repairPart, quantityAssigned]) => ({ repairPart, quantityAssigned }));
    if (!repairParts.length) {
      Alert.alert("Alert", "Please select products used to resolve this complaint.");
      return;
    }
    await generateInvoice(Number(complaintId), repairParts);
    Alert.alert("Done", "Bill generated successfully.");
    navigation.replace("Dashboard");
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.replace("Dashboard")}>
            <Text style={styles.back}>Back</Text>
          </Pressable>
          <Text style={styles.title}>COMPLAINT</Text>
          {accountType === 0 ? <Pressable onPress={cancel}><Text style={styles.delete}>Delete</Text></Pressable> : <View style={{ width: 48 }} />}
        </View>

        <Panel>
          <Info label="Complaint ID" value={String(complaintId)} bold />
          <Info label="Status" value={complaint?.status ?? "NA"} color={statusColor(complaint?.status)} />
          <Info label="Description" value={complaint?.description ?? "NA"} />
          <Info label="Item" value={complaint?.item ?? complaint?.itemType ?? "NA"} />
          <Info label="Raised" value={`${created.date} ${created.time}`} />
        </Panel>

        {complaint?.itemImage ? <Image source={{ uri: complaint.itemImage }} style={styles.heroImage} /> : null}

        {accountType === 0 ? (
          <CustomerSection
            complaint={complaint}
            navigation={navigation}
            technicianID={technicianID}
            technicianName={technicianName}
            technicianContact={technicianContact}
          />
        ) : (
          <TechnicianSection complaint={complaint} products={products} selectedParts={selectedParts} setSelectedParts={setSelectedParts} createInvoice={createInvoice} />
        )}
      </ScrollView>
    </Screen>
  );
}

function CustomerSection({
  complaint,
  navigation,
  technicianID,
  technicianName,
  technicianContact,
}: {
  complaint: Complaint | null;
  navigation: Props["navigation"];
  technicianID: number | null;
  technicianName: string | null;
  technicianContact: string | null;
}) {
  return (
    <View style={{ gap: 14 }}>
      {complaint?.status === "InProgress" ? (
        <Panel>
          <Text style={styles.sectionTitle}>Technician is allocated.</Text>
          <Info label="Technician ID" value={String(technicianID ?? "NA")} />
          <Info label="Technician Name" value={technicianName ?? "NA"} />
          <Info label="Technician Contact" value={technicianContact ?? "NA"} />
          <Info label="OTP" value={String(complaint?.otp ?? "NA")} bold />
        </Panel>
      ) : null}
      {complaint?.status === "Completed" ? (
        <AppButton title="Give Feedback" icon="star-outline" onPress={() => navigation.navigate("Feedback", { complaintId: complaint?.complaintId, technicianId: technicianID ?? undefined })} />
      ) : null}
    </View>
  );
}

function TechnicianSection({
  complaint,
  products,
  selectedParts,
  setSelectedParts,
  createInvoice
}: {
  complaint: Complaint | null;
  products: NonNullable<Complaint["productsAssigned"]>;
  selectedParts: Record<string, number>;
  setSelectedParts: (value: Record<string, number>) => void;
  createInvoice: () => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <Panel>
        <Info label="Customer Name" value={complaint?.customerName ?? "NA"} bold />
        <Info label="Customer Number" value={complaint?.contact ?? "NA"} onPress={() => complaint?.contact && Linking.openURL(`tel:+91${complaint.contact}`)} />
        <Info label="Address" value={complaint?.address ?? complaint?.location ?? "NA"} />
      </Panel>
      <Panel>
        <Text style={styles.sectionTitle}>Assigned Products</Text>
        {products.length ? products.map(product => {
          const name = product.repairPart ?? "Product";
          const current = selectedParts[name] ?? product.quantityAssigned ?? 0;
          return (
            <View key={name} style={styles.partRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.partName}>{name}</Text>
                <Text style={styles.partDesc}>{product.description ?? ""}</Text>
              </View>
              <TextInput
                value={String(current)}
                onChangeText={text => setSelectedParts({ ...selectedParts, [name]: Number(text) || 0 })}
                keyboardType="number-pad"
                style={styles.qty}
              />
            </View>
          );
        }) : <Text style={styles.muted}>No assigned products.</Text>}
      </Panel>
      {complaint?.status !== "Completed" ? <AppButton title="Generate Bill" icon="receipt-outline" onPress={createInvoice} /> : null}
    </View>
  );
}

function Info({ label, value, bold, color, onPress }: { label: string; value: string; bold?: boolean; color?: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, bold && styles.bold, color ? { color } : null]}>{value || "NA"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 36 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: "900" },
  back: { color: colors.text, fontWeight: "800" },
  delete: { color: colors.red, fontWeight: "800" },
  infoRow: { paddingVertical: 8, gap: 4 },
  infoLabel: { color: colors.muted, fontSize: 13 },
  infoValue: { color: colors.text, fontSize: 16, lineHeight: 22 },
  bold: { fontWeight: "900" },
  heroImage: { width: "100%", height: 210, borderRadius: 12, backgroundColor: colors.panel },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "900", marginBottom: 8, textAlign: "center" },
  partRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomColor: colors.border, borderBottomWidth: 1 },
  partName: { color: colors.text, fontWeight: "800" },
  partDesc: { color: colors.muted, fontSize: 12 },
  qty: { width: 64, height: 42, borderColor: colors.border, borderWidth: 1, color: colors.text, borderRadius: 8, textAlign: "center" },
  muted: { color: colors.muted, textAlign: "center", paddingVertical: 12 }
});