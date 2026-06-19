import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors, radius, shadows, spacing } from "../constants/theme";
import ComplaintDetailsScreen from "../screens/ComplaintDetailsScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import HomeScreen from "../screens/HomeScreen";
import InvoiceWebViewScreen from "../screens/InvoiceWebViewScreen";
import LoginPhoneScreen from "../screens/LoginPhoneScreen";
import PhoneSignInScreen from "../screens/PhoneSignInScreen";
import LoginUserIdScreen from "../screens/LoginUserIdScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RaiseComplaintScreen from "../screens/RaiseComplaintScreen";
import RegistrationScreen from "../screens/RegistrationScreen";
import SplashScreen from "../screens/SplashScreen";
import TechnicianOtpScreen from "../screens/TechnicianOtpScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import type { DashboardTabParamList, RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<DashboardTabParamList>();

function DashboardTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          left: spacing.md,
          right: spacing.md,
          bottom: spacing.sm,
          minHeight: 68,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          backgroundColor: colors.panel,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          borderRadius: radius.xl,
          ...shadows.lg,
        },
        tabBarItemStyle: {
          borderRadius: radius.lg,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
        },
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={route.name === "Home" ? "home" : "person-circle"} color={color} size={size + 2} />
        )
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="LoginUserId" component={LoginUserIdScreen} />
      <Stack.Screen name="LoginPhone" component={LoginPhoneScreen} />
      <Stack.Screen name="PhoneSignIn" component={PhoneSignInScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="Dashboard" component={DashboardTabs} />
      <Stack.Screen name="RaiseComplaint" component={RaiseComplaintScreen} />
      <Stack.Screen name="ComplaintDetails" component={ComplaintDetailsScreen} />
      <Stack.Screen name="InvoiceWebView" component={InvoiceWebViewScreen} />
      <Stack.Screen name="TechnicianOtp" component={TechnicianOtpScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
    </Stack.Navigator>
  );
}
