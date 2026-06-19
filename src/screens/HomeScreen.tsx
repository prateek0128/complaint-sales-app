import { useFocusEffect, type CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { fetchCustomerComplaints, fetchTechnicianComplaints, getInfo } from "../api/api";
import { Avatar, Card, EmptyState, LoadingState, Screen } from "../components/ui";
import { colors, radius, shadows, spacing, typography } from "../constants/theme";
import type { DashboardTabParamList, RootStackParamList } from "../navigation/types";
import { Complaint, formatDateTime, pickList, pickObject, statusColor } from "../utils/data";
import { addSubscribeTopic, notificationTopicForAccount, showWelcomeNotificationOnce } from "../utils/notifications";
import { storage } from "../utils/storage";

type Props = CompositeScreenProps<BottomTabScreenProps<DashboardTabParamList, "Home">, NativeStackScreenProps<RootStackParamList>>;
type ComplaintFilter = "all" | "active" | "pending" | "resolved" | "cancelled";

const normalizeStatus = (status?: string) => String(status ?? "").trim().toLowerCase();
const normalizeSearch = (value: unknown) => String(value ?? "").trim().toLowerCase();

const complaintSearchText = (item: Complaint) => {
  const created = formatDateTime(item.createdAt);
  const updated = formatDateTime(item.updatedAt);
  const products = item.productsAssigned
    ?.flatMap(product => [product.repairPart, product.description, product.quantityAssigned])
    .join(" ");

  return normalizeSearch([
    item.complaintId,
    item.status,
    item.item,
    item.itemType,
    item.description,
    item.customerName,
    item.contact,
    item.address,
    item.location,
    item.technicianId,
    item.otp,
    created.date,
    created.time,
    updated.date,
    updated.time,
    products,
  ].join(" "));
};

export default function HomeScreen({ navigation }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState(0);
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("");
  const [gender, setGender] = useState("");
  const [tab, setTab] = useState<ComplaintFilter>("all");
  const [search, setSearch] = useState("");

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
      const fetchedGender = String(details.Gender ?? details.gender ?? "");
      setGender(fetchedGender || (await storage.getInfoGender()));
      if (fetchedGender) await storage.setInfoGender(fetchedGender);
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
      setGender(await storage.getInfoGender());
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
    const searchTerm = normalizeSearch(search);
    return complaints.filter(item => {
      const status = normalizeStatus(item.status);
      const matchesTab =
        tab === "all" ? true :
        tab === "resolved" ? status === "completed" || status === "resolved" :
        tab === "pending" ? status === "pending" :
        tab === "cancelled" ? status === "cancelled" || status === "canceled" :
        status === "inprogress" || status === "in progress" || status === "active";

      if (!matchesTab) return false;
      if (!searchTerm) return true;
      return complaintSearchText(item).includes(searchTerm);
    });
  }, [complaints, search, tab]);

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
        <Avatar uri={profile} gender={gender} />
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

      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search complaints by anything"
          placeholderTextColor={colors.subtle}
          selectionColor={colors.primaryLight}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {search ? (
          <Pressable onPress={() => setSearch("")} hitSlop={10} style={styles.searchClear}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <LoadingState label="Fetching complaints..." />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item, index) => String(item.complaintId ?? index)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="No complaints found" message={search ? "Try a different search term or filter." : "New service requests will appear here."} />}
          contentContainerStyle={{ paddingBottom: 168 }}
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
          <View style={styles.complaintTitleRow}>
            <Text style={styles.complaintTitle} numberOfLines={1}>#{item.complaintId ?? "NA"}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusColor(item.status) + "22", borderColor: statusColor(item.status) + "55" }]}>
              <Text style={[styles.statusPillText, { color: statusColor(item.status) }]} numberOfLines={1}>{item.status ?? "NA"}</Text>
            </View>
          </View>
          <Text style={styles.complaintItemLabel} numberOfLines={1}>
            {String(type).toUpperCase()}
          </Text>
          <Text style={styles.complaintDesc} numberOfLines={2}>
            <Text style={styles.complaintDescLabel}>Description: </Text>
            {item.description ?? item.location ?? "No description provided."}
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
    borderRadius: radius.xl,
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
    borderRadius: radius.lg,
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
    borderRadius: radius.lg,
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
    minWidth: 50,
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
  searchShell: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    minHeight: 52,
    ...typography.body1,
    color: colors.text,
  },
  searchClear: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panelAlt,
  },
  complaintCard: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 144,
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
  complaintTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  complaintTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  statusPill: {
    maxWidth: 120,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusPillText: {
    ...typography.caption,
    fontWeight: "900",
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
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: "900",
    //textAlign: "right",
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
    bottom: 96,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  }
});
