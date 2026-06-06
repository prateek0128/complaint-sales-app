import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar, Panel, Screen } from "../components/ui";
import { colors } from "../constants/theme";
import type { DashboardTabParamList, RootStackParamList } from "../navigation/types";
import { storage } from "../utils/storage";

type Props = CompositeScreenProps<BottomTabScreenProps<DashboardTabParamList, "Profile">, NativeStackScreenProps<RootStackParamList>>;

export default function ProfileScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState("");

  useEffect(() => {
    void (async () => {
      setName(await storage.getInfoName());
      setEmail(await storage.getInfoEmail());
      setProfile(await storage.getInfoProfile());
    })();
  }, []);

  const logout = async () => {
    await storage.clearAll();
    navigation.replace("Welcome");
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profile}>
          <Avatar uri={profile} size={96} />
          <Text style={styles.name}>{name || "User"}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
        <Panel>
          <Text style={styles.panelTitle}>About App</Text>
          <Text style={styles.copy}>Maheshwari Infotech Complaint App</Text>
          <Text style={styles.muted}>This app helps customers register complaints, track technician visits, and receive service updates.</Text>
          <Text style={styles.muted}>App Version: 1.0.0</Text>
        </Panel>
        <Panel>
          <Text style={styles.panelTitle}>Help & Support</Text>
          <Pressable onPress={() => Linking.openURL("tel:+917409548907")}>
            <Text style={styles.link}>Contact Us: 7409548907</Text>
          </Pressable>
        </Panel>
        <Pressable style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingTop: 32
  },
  profile: {
    alignItems: "center",
    gap: 8,
    marginBottom: 12
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  email: {
    color: colors.muted
  },
  panelTitle: {
    color: colors.red,
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 10
  },
  copy: {
    color: colors.text,
    fontWeight: "800",
    marginBottom: 8
  },
  muted: {
    color: colors.muted,
    lineHeight: 21,
    marginBottom: 6
  },
  link: {
    color: colors.green,
    fontWeight: "800",
    paddingVertical: 8
  },
  logout: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 18
  },
  logoutText: {
    color: colors.red,
    fontWeight: "900",
    fontSize: 16
  }
});
