import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { fetchCustomerComplaints, fetchTechnicianComplaints, getInfo } from "../api/api";
import { Avatar, Panel, Screen } from "../components/ui";
import { colors } from "../constants/theme";
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
      const displayName = String(details.name ?? `${details.firstName ?? ""} ${details.lastName ?? ""}`.trim() ?? "");
      setName(displayName || (await storage.getInfoName()));
      setProfile(String(details.profileImage ?? details.profilePicture ?? ""));
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
          <Text style={styles.welcome}>Welcome</Text>
          <Text style={styles.name}>{name || "User"}</Text>
        </View>
      </View>
      <View style={styles.stats}>
        <Stat title="Open Complaint" count={openCount} icon="warning-outline" color={colors.red} />
        {accountType === 0 ? <Stat title="Resolved Complaint" count={resolvedCount} icon="checkmark-circle-outline" color={colors.green} /> : null}
      </View>
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "open" && styles.tabActive]} onPress={() => setTab("open")}>
          <Text style={styles.tabText}>Unresolved</Text>
        </Pressable>
        {accountType === 0 ? (
          <Pressable style={[styles.tab, tab === "resolved" && styles.tabActive]} onPress={() => setTab("resolved")}>
            <Text style={styles.tabText}>Resolved</Text>
          </Pressable>
        ) : null}
      </View>
      {loading ? (
        <ActivityIndicator color={colors.text} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item, index) => String(item.complaintId ?? index)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.text} />}
          ListEmptyComponent={<Text style={styles.empty}>No complaints found.</Text>}
          contentContainerStyle={{ paddingBottom: 92 }}
          renderItem={({ item }) => <ComplaintCard item={item} onPress={() => navigation.navigate("ComplaintDetails", { complaintId: item.complaintId, complaint: item })} />}
        />
      )}
      {accountType === 0 ? (
        <Pressable style={styles.fab} onPress={() => navigation.navigate("RaiseComplaint")}>
          <Ionicons name="create-outline" color="#fff" size={28} />
        </Pressable>
      ) : null}
    </Screen>
  );
}

function Stat({ title, count, icon, color }: { title: string; count: number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: color }]}>
      <Ionicons name={icon} color="#fff" size={32} />
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statCount}>{count}</Text>
    </View>
  );
}

function ComplaintCard({ item, onPress }: { item: Complaint; onPress: () => void }) {
  const { date, time } = formatDateTime(item.createdAt ?? item.updatedAt);
  const type = item.item ?? item.itemType ?? "Item";
  return (
    <Pressable onPress={onPress}>
      <Panel>
        <View style={styles.cardRow}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={styles.cardTitle}>Complaint ID: {item.complaintId ?? "NA"}</Text>
            <Text style={styles.desc} numberOfLines={4}>Description: {item.description ?? item.location ?? "NA"}</Text>
            <Text style={[styles.status, { color: statusColor(item.status) }]}>Status: {item.status ?? "NA"}</Text>
            <Text style={styles.date}>{date} {time}</Text>
          </View>
          <View style={styles.cardSide}>
            <Text style={styles.itemType} numberOfLines={1}>{String(type).toUpperCase()}</Text>
            {item.itemImage ? <Image source={{ uri: item.itemImage }} style={styles.thumb} /> : <View style={styles.thumbPlaceholder} />}
          </View>
        </View>
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  userCard: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    backgroundColor: colors.black,
    borderRadius: 14,
    padding: 12,
    marginTop: 8
  },
  welcome: {
    color: colors.muted,
    fontSize: 13
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  stats: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 12
  },
  stat: {
    flex: 1,
    minHeight: 128,
    borderRadius: 12,
    padding: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  statTitle: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8
  },
  statCount: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 20,
    marginTop: 4
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: colors.border,
    alignItems: "center"
  },
  tabActive: {
    borderColor: colors.text
  },
  tabText: {
    color: colors.text,
    fontWeight: "700"
  },
  empty: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 32
  },
  cardRow: {
    flexDirection: "row",
    gap: 12
  },
  cardTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16
  },
  desc: {
    color: colors.muted,
    lineHeight: 20
  },
  status: {
    fontWeight: "900"
  },
  date: {
    color: colors.muted,
    fontSize: 12
  },
  cardSide: {
    width: 92,
    alignItems: "flex-end",
    gap: 8
  },
  itemType: {
    color: colors.red,
    fontWeight: "900",
    fontSize: 12
  },
  thumb: {
    width: 82,
    height: 82,
    borderRadius: 8
  },
  thumbPlaceholder: {
    width: 82,
    height: 82,
    borderRadius: 8,
    backgroundColor: colors.panelAlt
  },
  fab: {
    position: "absolute",
    right: 22,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center"
  }
});
