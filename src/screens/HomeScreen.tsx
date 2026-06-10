import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { fetchCustomerComplaints, fetchTechnicianComplaints, getInfo } from "../api/api";
import { Avatar, Card, Screen } from "../components/ui";
import { colors, radius, shadows, spacing, typography } from "../constants/theme";
import type { DashboardTabParamList, RootStackParamList } from "../navigation/types";
import { Complaint, formatDateTime, pickList, pickObject, statusColor } from "../utils/data";
import { storage } from "../utils/storage";

type Props = CompositeScreenProps<BottomTabScreenProps<DashboardTabParamList, "Home">, NativeStackScreenProps<RootStackParamList>>;

export default function HomeScreen({ navigation }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState(0);
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("");
  const [tab, setTab] = useState<"open" | "resolved">("open");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await storage.getUserId();
      const type = await storage.getAccountType();
      const phone = await storage.getPhoneNumber();
      setAccountType(type);
      const info = await getInfo(userId, type, phone);
      const details = pickObject<Record<string, unknown>>(info.data);
      // Backend returns First_Name, Last_Name, Profile_Picture (capital keys)
      const displayName = `${details.First_Name ?? ""} ${details.Last_Name ?? ""}`.trim();
      setName(displayName || (await storage.getInfoName()));
      setProfile(String(details.Profile_Picture ?? ""))
      const response = type === 0 ? await fetchCustomerComplaints(userId) : await fetchTechnicianComplaints(userId);
      setComplaints(pickList(response.data));
    } catch {
      setComplaints([]);
      setName(await storage.getInfoName());
      setProfile(await storage.getInfoProfile());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (accountType !== 0) return complaints.filter(item => item.status !== "Completed");
    return complaints.filter(item => (tab === "resolved" ? item.status === "Completed" : item.status !== "Completed"));
  }, [accountType, complaints, tab]);

  const openCount = complaints.filter(item => item.status !== "Completed").length;
  const resolvedCount = complaints.filter(item => item.status === "Completed").length;

  return (
    <Screen>
      <View style={styles.userCard}>
        <Avatar uri={profile} />
        <View style={{ flex: 1 }}>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.name}>{name || "User"}</Text>
        </View>
      </View>
      
      <View style={styles.stats}>
        <Stat title="Open Issues" count={openCount} icon="warning" color={colors.warning} />
        {accountType === 0 ? <Stat title="Resolved" count={resolvedCount} icon="checkmark-circle" color={colors.success} /> : null}
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "open" && styles.tabActive]} onPress={() => setTab("open")}>
          <Text style={[styles.tabText, tab === "open" && styles.tabTextActive]}>Active</Text>
        </Pressable>
        {accountType === 0 ? (
          <Pressable style={[styles.tab, tab === "resolved" && styles.tabActive]} onPress={() => setTab("resolved")}>
            <Text style={[styles.tabText, tab === "resolved" && styles.tabTextActive]}>Resolved</Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item, index) => String(item.complaintId ?? index)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No complaints found.</Text>}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => <ComplaintCard item={item} onPress={() => navigation.navigate("ComplaintDetails", { complaintId: item.complaintId, complaint: item })} />}
        />
      )}
      {accountType === 0 ? (
        <Pressable style={styles.fab} onPress={() => navigation.navigate("RaiseComplaint")}>
          <Ionicons name="add" color="#fff" size={32} />
        </Pressable>
      ) : null}
    </Screen>
  );
}

function Stat({ title, count, icon, color }: { title: string; count: number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: color + "1A", borderColor: color + "33" }]}>
      <View style={[styles.iconWrap, { backgroundColor: color }]}>
        <Ionicons name={icon} color="#fff" size={20} />
      </View>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function ComplaintCard({ item, onPress }: { item: Complaint; onPress: () => void }) {
  const { date, time } = formatDateTime(item.createdAt ?? item.updatedAt);
  const type = item.item ?? item.itemType ?? "Item";
  return (
    <Card onPress={onPress}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>#{item.complaintId ?? "NA"}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + "22" }]}>
              <Text style={[styles.status, { color: statusColor(item.status) }]}>{item.status ?? "NA"}</Text>
            </View>
          </View>
          <Text style={styles.desc} numberOfLines={2}>{item.description ?? item.location ?? "No description provided."}</Text>
          <View style={styles.cardFooter}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={styles.date}>{date} {time}</Text>
          </View>
        </View>
        <View style={styles.cardSide}>
          {item.itemImage ? <Image source={{ uri: item.itemImage }} style={styles.thumb} /> : <View style={styles.thumbPlaceholder}><Ionicons name="image-outline" size={24} color={colors.muted} /></View>}
          <Text style={styles.itemType} numberOfLines={1}>{String(type).toUpperCase()}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  userCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  welcome: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  name: {
    ...typography.heading3,
    color: colors.text,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  stat: {
    flex: 1,
    minHeight: 110,
    borderRadius: radius.lg,
    padding: spacing.md,
    justifyContent: "space-between",
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  statTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  statCount: {
    ...typography.heading2,
    color: colors.text,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.panelAlt,
    ...shadows.sm,
  },
  tabText: {
    ...typography.button,
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.text,
  },
  empty: {
    ...typography.body1,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
  cardRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.heading3,
    fontSize: 18,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.pill,
  },
  status: {
    ...typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  desc: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: "auto",
  },
  date: {
    ...typography.caption,
    color: colors.muted,
  },
  cardSide: {
    width: 80,
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  itemType: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: "800",
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  thumbPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.panelAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  }
});
