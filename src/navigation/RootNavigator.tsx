import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../constants/theme";
import ComplaintDetailsScreen from "../screens/ComplaintDetailsScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginPhoneScreen from "../screens/LoginPhoneScreen";
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
        tabBarStyle: { backgroundColor: "#050505", borderTopColor: colors.border },
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={route.name === "Home" ? "home" : "person"} color={color} size={size} />
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
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="Dashboard" component={DashboardTabs} />
      <Stack.Screen name="RaiseComplaint" component={RaiseComplaintScreen} />
      <Stack.Screen name="ComplaintDetails" component={ComplaintDetailsScreen} />
      <Stack.Screen name="TechnicianOtp" component={TechnicianOtpScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
    </Stack.Navigator>
  );
}
