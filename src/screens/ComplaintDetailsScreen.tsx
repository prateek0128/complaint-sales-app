import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { deleteComplaint, fetchComplaintDetails, fetchAssignedTechDetails, generateInvoice } from "../api/api";
import { AppButton, Panel, Screen } from "../components/ui";
import { colors } from "../constants/theme";
// import { PUBLIC_INVOICE_CREATE_URL } from "../constants/urls";
import type { RootStackParamList } from "../navigation/types";
import { Complaint, formatDateTime, pickObject, statusColor, mapComplaint } from "../utils/data";
import { storage } from "../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "ComplaintDetails">;

// const publicInvoiceUrl = (invoiceUrl: string) => {
//   const queryIndex = invoiceUrl.indexOf("?");
//   return `${PUBLIC_INVOICE_CREATE_URL}${queryIndex >= 0 ? invoiceUrl.slice(queryIndex) : ""}`;
// };

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
        const mappedComplaint = mapComplaint(picked);
        setComplaint(previous => ({ ...previous, ...mappedComplaint }));
        
        // Log subscribeToken for debugging
        console.log('Complaint subscribeToken:', mappedComplaint.subscribeToken);
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
        const tech = pickObject<Record<string, unknown>>(techRes.data);
        if (tech) {
          const techId = tech.Id ?? tech.ID ?? tech.Technician_ID ?? tech.technicianId ?? tech.id;
          const firstName = tech.First_Name ?? tech.firstName ?? "";
          const lastName = tech.Last_Name ?? tech.lastName ?? "";
          const contact = tech.Contact ?? tech.contact ?? tech.phoneNumber;

          setTechnicianID(techId == null ? null : Number(techId));
          setTechnicianName(`${firstName} ${lastName}`.trim() || null);
          setTechnicianContact(contact == null ? null : String(contact));
        }
      } catch {
        // Leave name/contact as null if endpoint is unavailable.
      }
    })();
  }, [complaint?.status, complaint?.complaintId, route.params?.complaintId]);

  const complaintId = complaint?.complaintId ?? route.params?.complaintId ?? "NA";
  const created = formatDateTime(complaint?.createdAt);
  const products = useMemo(() => complaint?.productsAssigned ?? [], [complaint?.productsAssigned]);
  const status = String(complaint?.status ?? "").trim().toLowerCase();
  const canCustomerCancel = accountType === 0 && status === "pending";

  const cancel = () => {
    if (!canCustomerCancel) {
      Alert.alert("Cannot Cancel", "Only pending complaints can be cancelled.");
      return;
    }

    Alert.alert("Cancel Complaint", "Are you sure you want to cancel this complaint?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteComplaint(Number(complaintId));
            setComplaint(previous => previous ? { ...previous, status: "Cancelled" } : previous);
            Alert.alert("Cancelled", "Complaint cancelled successfully.", [
              { text: "OK", onPress: () => navigation.replace("Dashboard") }
            ]);
          } catch (err) {
            const serverMessage =
              (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Alert.alert("Error", serverMessage ?? "Unable to cancel complaint.");
          }
        }
      }
    ]);
  };

  const createInvoice = async () => {
    const repairParts = Object.entries(selectedParts).map(([part, quantity]) => ({ part, quantity }));
    if (!repairParts.length) {
      Alert.alert("Alert", "Please select products used to resolve this complaint.");
      return;
    }
    try {
      const response = await generateInvoice(complaintId, repairParts);
      console.log(response.data);
      
      const invoiceUrl = String(response.data?.InvoiceUrl ?? response.data?.invoiceUrl ?? "");
      if (!invoiceUrl) {
        Alert.alert("Failed", "Something went wrong please try after some time.");
        return;
      }

      const fallbackTechnicianId = await storage.getUserId();
      const customerSubscribeToken = complaint?.subscribeToken ?? route.params?.complaint?.subscribeToken;
      
      console.log('Passing subscribeToken to InvoiceWebView:', customerSubscribeToken);
      
      navigation.navigate("InvoiceWebView", {
        url: invoiceUrl,
        complaintId,
        technicianId: complaint?.technicianId ?? fallbackTechnicianId,
        subscribeToken: customerSubscribeToken
      });
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.replace("Dashboard")}>
            <Text style={styles.back}>Back</Text>
          </Pressable>
          <Text style={styles.title}>COMPLAINT</Text>
          {canCustomerCancel ? <Pressable onPress={cancel}><Text style={styles.delete}>Delete</Text></Pressable> : <View style={{ width: 48 }} />}
        </View>

        <Panel>
          <Info label="Complaint ID" value={String(complaintId)} bold />
          <Info label="Status" value={complaint?.status ?? "NA"} color={statusColor(complaint?.status)} />
          <Info label="Description" value={complaint?.description ?? "NA"} />
          <Info label="Item" value={complaint?.item ?? complaint?.itemType ?? "NA"} />
          <Info label="Raised at" value={`${created.date} ${created.time}`} />
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
  const hasSelectedParts = Object.keys(selectedParts).length > 0;

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
          const maxAllowed = Number(product.quantityAssigned ?? 0);
          const isSelected = selectedParts[name] != null;
          const current = selectedParts[name] ?? maxAllowed;
          const setPartQuantity = (nextValue: number) => {
            const boundedValue = Math.max(0, Math.min(nextValue, maxAllowed));
            setSelectedParts({ ...selectedParts, [name]: boundedValue });
          };
          return (
            <View key={name} style={styles.partRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.partName}>{name}</Text>
                <Text style={styles.partDesc}>{product.description ?? ""}</Text>
              </View>
              <View style={styles.qtyStepper}>
                <Pressable
                  style={[styles.qtyButton, current <= 0 && styles.qtyButtonDisabled]}
                  disabled={current <= 0}
                  onPress={() => setPartQuantity(current - 1)}
                  hitSlop={8}
                >
                  <Ionicons name="remove" color={current <= 0 ? colors.muted : colors.text} size={18} />
                </Pressable>
                <TextInput
                  value={String(current)}
                  onChangeText={text => {
                    const nextValue = Number(text) || 0;
                    if (nextValue > maxAllowed) {
                      Alert.alert("Alert", "You cannot assign more quantity than the current assigned quantity.");
                      setPartQuantity(maxAllowed);
                      return;
                    }
                    setPartQuantity(nextValue);
                  }}
                  keyboardType="number-pad"
                  style={styles.qty}
                />
                <Pressable
                  style={[styles.qtyButton, current >= maxAllowed && styles.qtyButtonDisabled]}
                  disabled={current >= maxAllowed}
                  onPress={() => setPartQuantity(current + 1)}
                  hitSlop={8}
                >
                  <Ionicons name="add" color={current >= maxAllowed ? colors.muted : colors.text} size={18} />
                </Pressable>
              </View>
              <Pressable
                style={[styles.checkBox, isSelected && styles.checkBoxSelected]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                hitSlop={10}
                onPress={() => {
                  const next = { ...selectedParts };
                  if (isSelected) {
                    delete next[name];
                  } else {
                    next[name] = current;
                  }
                  setSelectedParts(next);
                }}
              >
                {isSelected ? <Ionicons name="checkmark" color={colors.white} size={18} /> : null}
              </Pressable>
            </View>
          );
        }) : <Text style={styles.muted}>No assigned products.</Text>}
      </Panel>
      {complaint?.status !== "Completed" ? <AppButton title="Generate Bill" icon="receipt-outline" onPress={createInvoice} disabled={!hasSelectedParts} /> : null}
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
  qtyStepper: { flexDirection: "row", alignItems: "center", borderColor: colors.border, borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  qtyButton: { width: 34, height: 42, alignItems: "center", justifyContent: "center", backgroundColor: colors.panelAlt },
  qtyButtonDisabled: { opacity: 0.45 },
  qty: { width: 48, height: 42, color: colors.text, textAlign: "center", borderLeftColor: colors.border, borderLeftWidth: 1, borderRightColor: colors.border, borderRightWidth: 1 },
  checkBox: { width: 26, height: 26, borderRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: colors.transparent, borderWidth: 2, borderColor: colors.border },
  checkBoxSelected: { backgroundColor: colors.success, borderColor: colors.success },
  muted: { color: colors.muted, textAlign: "center", paddingVertical: 12 }
});
