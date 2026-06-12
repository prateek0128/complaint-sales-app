import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { colors } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "InvoiceWebView">;

const captureConsoleScript = `
  (function() {
    if (window.__invoiceConsolePatched) return;
    window.__invoiceConsolePatched = true;
    var oldLog = console.log;
    console.log = function() {
      var message = Array.prototype.slice.call(arguments).join(' ');
      window.ReactNativeWebView.postMessage(message);
      oldLog.apply(console, arguments);
    };
  })();
  true;
`;

export default function InvoiceWebViewScreen({ navigation, route }: Props) {
  const didNavigate = useRef(false);

  const goToOtp = () => {
    if (didNavigate.current) return;
    didNavigate.current = true;
    Alert.alert("Invoice Sent", "The invoice has been successfully sent to your email");
    navigation.replace("TechnicianOtp", {
      complaintId: route.params.complaintId,
      technicianId: route.params.technicianId,
      subscribeToken: route.params.subscribeToken
    });
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    if (event.nativeEvent.data.includes("emailResponse Email sent successfully")) {
      goToOtp();
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>INVOICE</Text>
        <View style={{ width: 48 }} />
      </View>
      <WebView
        source={{ uri: route.params.url }}
        style={styles.webView}
        injectedJavaScriptBeforeContentLoaded={captureConsoleScript}
        injectedJavaScript={captureConsoleScript}
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.black
  },
  back: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  webView: {
    flex: 1,
    backgroundColor: colors.background
  }
});
