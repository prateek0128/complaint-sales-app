import { useFocusEffect, type CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchCustomerComplaints, fetchTechnicianComplaints, getInfo } from "../api/api";
import { Avatar, Card, Screen } from "../components/ui";
import { colors, radius, shadows, spacing, typography } from "../constants/theme";
import type { DashboardTabParamList, RootStackParamList } from "../navigation/types";
import { Complaint, formatDateTime, pickList, pickObject, statusColor } from "../utils/data";
import { addSubscribeTopic, notificationTopicForAccount, showWelcomeNotificationOnce } from "../utils/notifications";
import { storage } from "../utils/storage";

type Props = CompositeScreenProps<BottomTabScreenProps<DashboardTabParamList, "Home">, NativeStackScreenProps<RootStackParamList>>;
type ComplaintFilter = "all" | "active" | "pending" | "resolved" | "cancelled";

const normalizeStatus = (status?: string) => String(status ?? "").trim().toLowerCase();

export default function HomeScreen({ navigation }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState(0);
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("");
  const [tab, setTab] = useState<ComplaintFilter>("all");

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
      const savedSubscribeToken = typeof details.SubscribeToken === "string" ? details.SubscribeToken.trim() : "";
      await storage.setSubscribeToken(savedSubscribeToken || notificationTopicForAccount(type, userId));
      await storage.setAdminToken(String(details.AdminToken ?? ""));
      await addSubscribeTopic();
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
    void showWelcomeNotificationOnce();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const visible = useMemo(() => {
    return complaints.filter(item => {
      const status = normalizeStatus(item.status);
      if (tab === "all") return true;
      if (tab === "resolved") return status === "completed" || status === "resolved";
      if (tab === "pending") return status === "pending";
      if (tab === "cancelled") return status === "cancelled" || status === "canceled";
      return status === "inprogress" || status === "in progress" || status === "active";
    });
  }, [complaints, tab]);

  const activeCount = complaints.filter(item => {
    const status = normalizeStatus(item.status);
    return status === "inprogress" || status === "in progress" || status === "active";
  }).length;
  const pendingCount = complaints.filter(item => normalizeStatus(item.status) === "pending").length;
  const resolvedCount = complaints.filter(item => {
    const status = normalizeStatus(item.status);
    return status === "completed" || status === "resolved";
  }).length;
  const cancelledCount = complaints.filter(item => {
    const status = normalizeStatus(item.status);
    return status === "cancelled" || status === "canceled";
  }).length;

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
        <Stat count={activeCount} title="Active" icon="construct" color={colors.warning} />
        <Stat title="Resolved" count={resolvedCount} icon="checkmark-circle" color={colors.success} />
      </View>

      <View style={styles.tabsShell}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          style={styles.tabsScroller}
        >
          <FilterTab label="All" value="all" selected={tab} onPress={setTab} />
          <FilterTab label="Active" value="active" selected={tab} onPress={setTab} />
          <FilterTab label="Pending" value="pending" selected={tab} onPress={setTab} />
          <FilterTab label="Resolved" value="resolved" selected={tab} onPress={setTab} />
          <FilterTab label="Cancelled" value="cancelled" selected={tab} onPress={setTab} />
        </ScrollView>
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

function FilterTab({
  label,
  value,
  selected,
  onPress
}: {
  label: string;
  value: ComplaintFilter;
  selected: ComplaintFilter;
  onPress: (value: ComplaintFilter) => void;
}) {
  const isSelected = selected === value;
  return (
    <Pressable style={[styles.tab, isSelected && styles.tabActive]} onPress={() => onPress(value)}>
      <Text style={[styles.tabText, isSelected && styles.tabTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function Stat({ title, count, icon, color }: { title: string; count: number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: color + "1A", borderColor: color + "33" }]}>
      <View style={[styles.iconWrap, { backgroundColor: color }]}>
        <Ionicons name={icon} color="#fff" size={18} />
      </View>
      <View style={styles.statText}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statCount}>{count}</Text>
      </View>
    </View>
  );
}

function ComplaintCard({ item, onPress }: { item: Complaint; onPress: () => void }) {
  const { date, time } = formatDateTime(item.createdAt ?? item.updatedAt);
  const type = item.item ?? item.itemType ?? "Item";
  const imageUri = item.itemImage ?? item.billImage;
  return (
    <Card onPress={onPress} style={styles.complaintCard}>
      <View style={styles.complaintCardContent}>
        <View style={styles.complaintMain}>
          <Text style={styles.complaintTitle} numberOfLines={1}>
            Complaint ID: {item.complaintId ?? "NA"}
          </Text>
          <Text style={styles.complaintDesc} numberOfLines={2}>
            <Text style={styles.complaintDescLabel}>Description: </Text>
            {item.description ?? item.location ?? "No description provided."}
          </Text>
          <Text style={[styles.complaintStatus, { color: statusColor(item.status) }]} numberOfLines={1}>
            Status: {item.status ?? "NA"}
          </Text>
          <View style={styles.complaintMetaRow}>
            <View style={styles.complaintMetaItem}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.complaintMetaText} numberOfLines={1}>
                {date}
              </Text>
            </View>
            <View style={styles.complaintMetaItem}>
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.complaintMetaText} numberOfLines={1}>
                {time || "NA"}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.complaintMedia}>
          <Text style={styles.complaintItemLabel} numberOfLines={1}>
            {String(type).toUpperCase()}
          </Text>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.complaintThumb} />
          ) : (
            <View style={styles.complaintThumbPlaceholder}>
              <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
            </View>
          )}
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
    minHeight: 72,
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  statText: {
    flex: 1,
    gap: 2,
  },
  statTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  statCount: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  tabsShell: {
    marginBottom: spacing.md,
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    minHeight: 52,
    justifyContent: "center",
    overflow: "hidden",
  },
  tabsScroller: {
    flexGrow: 0,
  },
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    minWidth: 80,
    minHeight: 42,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: colors.panelAlt,
    ...shadows.sm,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
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
  complaintCard: {
    backgroundColor: colors.black,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    minHeight: 150,
  },
  complaintCardContent: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
  },
  complaintMain: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  complaintTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
  },
  complaintDesc: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  complaintDescLabel: {
    color: colors.textSecondary,
    fontWeight: "800",
  },
  complaintStatus: {
    fontSize: 17,
    fontWeight: "900",
  },
  complaintMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: spacing.lg,
    rowGap: spacing.xs,
    marginTop: spacing.xs,
  },
  complaintMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  complaintMetaText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  complaintMedia: {
    width: 96,
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  complaintItemLabel: {
    color: colors.error,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "right",
  },
  complaintThumb: {
    width: 86,
    height: 78,
    borderRadius: radius.sm,
    backgroundColor: colors.panelAlt,
  },
  complaintThumbPlaceholder: {
    width: 86,
    height: 78,
    borderRadius: radius.sm,
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
