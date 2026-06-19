import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { AppHeader, IconButton, Screen, useAppAlert } from "../components/ui";
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
  const alert = useAppAlert();
  const didNavigate = useRef(false);

  const goToOtp = () => {
    if (didNavigate.current) return;
    didNavigate.current = true;
    alert.show("Invoice Sent", "The invoice has been successfully sent to your email", [
      {
        text: "Continue",
        onPress: () => navigation.replace("TechnicianOtp", {
          complaintId: route.params.complaintId,
          technicianId: route.params.technicianId,
          subscribeToken: route.params.subscribeToken
        })
      }
    ]);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    if (event.nativeEvent.data.includes("emailResponse Email sent successfully")) {
      goToOtp();
    }
  };

  return (
    <Screen padded={false} style={styles.root}>
      <View style={styles.headerShell}>
        <AppHeader
          title="Invoice"
          subtitle="Review and send the generated bill."
          left={<IconButton icon="chevron-back" variant="soft" onPress={() => navigation.goBack()} />}
          style={styles.header}
        />
      </View>
      <WebView
        source={{ uri: route.params.url }}
        style={styles.webView}
        injectedJavaScriptBeforeContentLoaded={captureConsoleScript}
        injectedJavaScript={captureConsoleScript}
        onMessage={handleMessage}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  headerShell: {
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    paddingBottom: 12,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.background
  }
});
