import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Application from "expo-application";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { loginWithPhone, getInfo } from "../api/api";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";
import { storage } from "../utils/storage";

const CLIENT_ID = "13482807120004084554";

type Props = NativeStackScreenProps<RootStackParamList, "PhoneSignIn">;

// React Native does not have atob — decode base64 manually
function decodeBase64(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  // pad to multiple of 4
  const input = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  for (let i = 0; i < input.length; i += 4) {
    const e1 = chars.indexOf(input[i]);
    const e2 = chars.indexOf(input[i + 1]);
    const e3 = chars.indexOf(input[i + 2]);
    const e4 = chars.indexOf(input[i + 3]);
    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;
    output += String.fromCharCode(c1);
    if (e3 !== 64) output += String.fromCharCode(c2);
    if (e4 !== 64) output += String.fromCharCode(c3);
  }
  return output;
}

export default function PhoneSignInScreen({ navigation }: Props) {
  const [deviceId, setDeviceId] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchId = async () => {
      let id = "";
      if (Platform.OS === "android") {
        id = Application.getAndroidId() ?? "";
      } else {
        id = (await Application.getIosIdForVendorAsync()) ?? "";
      }
      setDeviceId(String(id));
    };
    fetchId();
  }, []);

  const handleMessage = async (event: { nativeEvent: { data: string } }) => {
    const encodedJWT = event.nativeEvent.data;
    if (!encodedJWT || processing) return;

    setProcessing(true);
    try {
      // Decode JWT payload — phone_no and country_code are directly in the payload
      const parts = encodedJWT.split(".");
      if (parts.length !== 3) {
        Alert.alert("Login Failed", "Invalid token received.");
        navigation.goBack();
        return;
      }

      const payload = JSON.parse(decodeBase64(parts[1]));
      const phoneNumber: string = `${payload.country_code ?? ""}${payload.phone_no ?? ""}`.trim();

      if (!phoneNumber) {
        Alert.alert("Login Failed", "Could not retrieve phone number.");
        navigation.goBack();
        return;
      }

      // POST { phoneNumber } to user/accountLogin
      // Mirrors Flutter: loginPhoneRequest(phone) → _dio.post(URLConstant.login, data: {'phoneNumber': phone})
      const response = await loginWithPhone(phoneNumber);
      const body = response.data as Record<string, unknown>;

      // Step 4: Check message — mirrors Flutter: result?.message == 'Login successful!'
      if (body.message !== "Login successful!") {
        Alert.alert("Failed", "Your Number is not Register");
        navigation.goBack();
        return;
      }

      // Step 5: Save prefs — mirrors Flutter setCheckLoginPreference
      // Flutter model: { message, userId, accountType, token, phonenumber }
      const userId = Number(body.userId ?? 0);
      const accountType = Number(body.accountType ?? 0);
      const token = String(body.token ?? "");
      const savedPhone = String(body.phonenumber ?? phoneNumber);

      await storage.setUserId(userId);
      await storage.setAccountType(accountType);
      await storage.setToken(token);
      await storage.setPhoneNumber(savedPhone);

      // Step 6: Call getInfo — mirrors Flutter getInfoRequest + setGetInfoPreference
      // Response: { Details: [{ First_Name, Last_Name, Profile_Picture, Email, Contact, Location }] }
      if (userId) {
        const infoRes = await getInfo(userId, accountType, savedPhone);
        const infoBody = infoRes.data as Record<string, unknown>;
        const details = Array.isArray(infoBody.Details)
          ? (infoBody.Details[0] as Record<string, unknown>)
          : {};

        await storage.setInfoName(`${details.First_Name ?? ""} ${details.Last_Name ?? ""}`.trim());
        await storage.setInfoEmail(String(details.Email ?? ""));
        await storage.setInfoNumber(String(details.Contact ?? savedPhone));
        await storage.setInfoAddress(String(details.Location ?? ""));
        await storage.setInfoProfile(String(details.Profile_Picture ?? ""));
      }

      navigation.replace("Dashboard");
    } catch (err) {
      console.error("PhoneSignIn error:", err);
      Alert.alert("Login Failed", "Unable to login. Please try again.");
      navigation.goBack();
    } finally {
      setProcessing(false);
    }
  };

  const uri = `https://auth.phone.email/log-in?client_id=${CLIENT_ID}&auth_type=4&device=${deviceId}`;

  return (
    <View style={styles.container}>
      {processing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.red} />
        </View>
      )}
      <WebView source={{ uri }} style={styles.webView} onMessage={handleMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webView: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10
  }
});
