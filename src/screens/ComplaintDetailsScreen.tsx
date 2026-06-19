import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { deleteComplaint, fetchComplaintDetails, fetchAssignedTechDetails, generateInvoice } from "../api/api";
import { AppButton, AppHeader, IconButton, Panel, Screen, SectionHeader, useAppAlert } from "../components/ui";
import { colors, radius, spacing, typography } from "../constants/theme";
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
  const alert = useAppAlert();
  const [complaint, setComplaint] = useState<Complaint | null>(route.params?.complaint ?? null);
  const [accountType, setAccountType] = useState(0);
  const [selectedParts, setSelectedParts] = useState<Record<string, number>>({});
  const [technicianID, setTechnicianID] = useState<number | null>(null);
  const [technicianName, setTechnicianName] = useState<string | null>(null);
  const [technicianContact, setTechnicianContact] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
      alert.show("Cannot Cancel", "Only pending complaints can be cancelled.");
      return;
    }

    alert.show("Cancel Complaint", "Are you sure you want to cancel this complaint?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteComplaint(Number(complaintId));
            setComplaint(previous => previous ? { ...previous, status: "Cancelled" } : previous);
            alert.show("Cancelled", "Complaint cancelled successfully.", [
              { text: "Done", onPress: () => navigation.replace("Dashboard") }
            ]);
          } catch (err) {
            const serverMessage =
              (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            alert.show("Error", serverMessage ?? "Unable to cancel complaint.");
          }
        }
      }
    ]);
  };

  const createInvoice = async () => {
    const repairParts = Object.entries(selectedParts).map(([part, quantity]) => ({ part, quantity }));
    if (!repairParts.length) {
      alert.show("Alert", "Please select products used to resolve this complaint.");
      return;
    }
    try {
      const response = await generateInvoice(complaintId, repairParts);
      console.log(response.data);
      
      const invoiceUrl = String(response.data?.InvoiceUrl ?? response.data?.invoiceUrl ?? "");
      if (!invoiceUrl) {
        alert.show("Failed", "Something went wrong please try after some time.");
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
      alert.show("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader
          title="Complaint"
          subtitle={`Ticket #${complaintId}`}
          left={<IconButton icon="chevron-back" variant="soft" onPress={() => navigation.replace("Dashboard")} />}
          right={canCustomerCancel ? <IconButton icon="trash-outline" variant="danger" onPress={cancel} /> : undefined}
        />

        <Panel>
          <SectionHeader title="Summary" right={<StatusBadge status={complaint?.status} />} />
          <Info label="Complaint ID" value={String(complaintId)} bold />
          <Info label="Description" value={complaint?.description ?? "NA"} />
          <Info label="Item" value={complaint?.item ?? complaint?.itemType ?? "NA"} />
          <Info label="Raised at" value={`${created.date} ${created.time}`} />
        </Panel>

        {complaint?.itemImage ? (
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel="Open complaint image"
            onPress={() => setPreviewImage(complaint.itemImage ?? null)}
            style={({ pressed }) => [styles.heroImageButton, pressed && styles.pressed]}
          >
            <Image source={{ uri: complaint.itemImage }} style={styles.heroImage} />
            <View style={styles.imageHint}>
              <Ionicons name="expand-outline" size={16} color={colors.white} />
              <Text style={styles.imageHintText}>View full image</Text>
            </View>
          </Pressable>
        ) : null}

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

      <Modal transparent visible={Boolean(previewImage)} animationType="fade" statusBarTranslucent onRequestClose={() => setPreviewImage(null)}>
        <View style={styles.previewOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreviewImage(null)} />
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Complaint Image</Text>
            <Pressable accessibilityRole="button" onPress={() => setPreviewImage(null)} hitSlop={10} style={styles.previewClose}>
              <Ionicons name="close" size={24} color={colors.white} />
            </Pressable>
          </View>
          {previewImage ? <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
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
          <SectionHeader title="Technician Allocated" subtitle="Use this OTP when the service is complete." />
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
  const alert = useAppAlert();
  const hasSelectedParts = Object.keys(selectedParts).length > 0;
  const status = String(complaint?.status ?? "").trim().toLowerCase();
  const isResolved = status === "completed" || status === "resolved";

  return (
    <View style={{ gap: 14 }}>
      <Panel>
        <Info label="Customer Name" value={complaint?.customerName ?? "NA"} bold />
        <Info label="Customer Number" value={complaint?.contact ?? "NA"} onPress={() => complaint?.contact && Linking.openURL(`tel:+91${complaint.contact}`)} />
        <Info label="Address" value={complaint?.address ?? complaint?.location ?? "NA"} />
      </Panel>
      <Panel>
        <SectionHeader
          title="Assigned Products"
          subtitle={isResolved ? "Products used for this resolved complaint." : "Select the parts used before generating the bill."}
        />
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
                  style={[styles.qtyButton, (isResolved || current <= 0) && styles.qtyButtonDisabled]}
                  disabled={isResolved || current <= 0}
                  onPress={() => setPartQuantity(current - 1)}
                  hitSlop={8}
                >
                  <Ionicons name="remove" color={isResolved || current <= 0 ? colors.muted : colors.text} size={18} />
                </Pressable>
                <TextInput
                  value={String(current)}
                  onChangeText={text => {
                    const nextValue = Number(text) || 0;
                    if (nextValue > maxAllowed) {
                      alert.show("Alert", "You cannot assign more quantity than the current assigned quantity.");
                      setPartQuantity(maxAllowed);
                      return;
                    }
                    setPartQuantity(nextValue);
                  }}
                  keyboardType="number-pad"
                  style={styles.qty}
                  editable={!isResolved}
                />
                <Pressable
                  style={[styles.qtyButton, (isResolved || current >= maxAllowed) && styles.qtyButtonDisabled]}
                  disabled={isResolved || current >= maxAllowed}
                  onPress={() => setPartQuantity(current + 1)}
                  hitSlop={8}
                >
                  <Ionicons name="add" color={isResolved || current >= maxAllowed ? colors.muted : colors.text} size={18} />
                </Pressable>
              </View>
              <Pressable
                style={[styles.checkBox, isSelected && styles.checkBoxSelected, isResolved && styles.checkBoxDisabled]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                disabled={isResolved}
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
      {!isResolved ? <AppButton title="Generate Bill" icon="receipt-outline" onPress={createInvoice} disabled={!hasSelectedParts} /> : null}
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

function StatusBadge({ status }: { status?: string }) {
  const color = statusColor(status);
  return (
    <View style={[styles.statusBadge, { backgroundColor: color + "22", borderColor: color + "55" }]}>
      <Text style={[styles.statusBadgeText, { color }]}>{status ?? "NA"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: 96 },
  infoRow: { paddingVertical: spacing.sm, gap: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { ...typography.caption, color: colors.muted },
  infoValue: { ...typography.body1, color: colors.text },
  bold: { fontWeight: "900" },
  heroImageButton: { position: "relative", borderRadius: radius.xl, overflow: "hidden" },
  heroImage: { width: "100%", height: 220, borderRadius: radius.xl, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  imageHint: { position: "absolute", right: spacing.md, bottom: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: "rgba(2,6,23,0.72)", borderColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  imageHintText: { ...typography.caption, color: colors.white, fontWeight: "800" },
  previewOverlay: { flex: 1, backgroundColor: "rgba(2,6,23,0.96)", alignItems: "center", justifyContent: "center", padding: spacing.md },
  previewHeader: { position: "absolute", top: spacing.xl, left: spacing.md, right: spacing.md, zIndex: 2, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewTitle: { ...typography.heading3, color: colors.white },
  previewClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  previewImage: { width: "100%", height: "82%" },
  pressed: { opacity: 0.86 },
  partRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md, borderBottomColor: colors.border, borderBottomWidth: 1 },
  partName: { color: colors.text, fontWeight: "900" },
  partDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  qtyStepper: { flexDirection: "row", alignItems: "center", borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, overflow: "hidden" },
  qtyButton: { width: 34, height: 42, alignItems: "center", justifyContent: "center", backgroundColor: colors.panelAlt },
  qtyButtonDisabled: { opacity: 0.45 },
  qty: { width: 48, height: 42, color: colors.text, textAlign: "center", borderLeftColor: colors.border, borderLeftWidth: 1, borderRightColor: colors.border, borderRightWidth: 1 },
  checkBox: { width: 26, height: 26, borderRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: colors.transparent, borderWidth: 2, borderColor: colors.border },
  checkBoxSelected: { backgroundColor: colors.success, borderColor: colors.success },
  checkBoxDisabled: { opacity: 0.55 },
  statusBadge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  statusBadgeText: { ...typography.caption, fontWeight: "900" },
  muted: { ...typography.body2, color: colors.muted, textAlign: "center", paddingVertical: spacing.md }
});
