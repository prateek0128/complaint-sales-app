import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import { sendTopicNotification, subscribeNotificationTopic } from "../api/api";
import { storage } from "./storage";

const ADMIN_NOTIFICATION_TOPIC = "notification";

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function notificationTopicForAccount(accountType: number, userId: number | string) {
  return accountType === 1 ? `technician_${userId}` : `customer_${userId}`;
}

async function subscribeWithExpoDeviceToken(topic: string) {
  const nativeToken = await messaging().getToken();
  console.log("Native FCM token:", nativeToken);

  if (!nativeToken || typeof nativeToken !== "string") {
    throw new Error("Native FCM token is missing.");
  }

  await messaging().subscribeToTopic(topic);
  console.log("Subscribed with Firebase Messaging to topic:", topic);

  await subscribeNotificationTopic(nativeToken, topic);
}

export async function initializeNotifications() {
  // Create notification channels for Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6366F1",
      sound: "default",
      enableVibrate: true,
    });

    await Notifications.setNotificationChannelAsync("high_importance", {
      name: "High Priority Notifications",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6366F1",
      sound: "default",
      enableVibrate: true,
    });
  }

  // Request notification permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== "granted") {
    console.warn("Failed to get push notification permissions");
    return;
  }

  await messaging().requestPermission();
  console.log("Notification permission:", finalStatus);

  messaging().onMessage(async remoteMessage => {
    const title = remoteMessage.notification?.title ?? "Notification";
    const body = remoteMessage.notification?.body ?? "";
    console.log("Foreground FCM notification received:", title, body);

    if (body) {
      await showLocalNotification(title, body, remoteMessage.data);
    }
  });

  // Listen for foreground notifications
  Notifications.addNotificationReceivedListener(notification => {
    console.log("Foreground notification received:", notification.request.content.title);
    // Show the notification even in foreground
  });

  // Listen for notification interactions
  Notifications.addNotificationResponseReceivedListener(response => {
    console.log("Notification clicked:", response.notification.request.content.data);
    // Handle navigation based on notification data
  });

  // Get initial notification if app was opened from notification
  const initialNotification = await Notifications.getLastNotificationResponseAsync();
  if (initialNotification) {
    console.log("App opened from notification:", initialNotification.notification.request.content.data);
  }
}

export async function addSubscribeTopic() {
  const savedTopic = await storage.getSubscribeToken();
  const userId = await storage.getUserId();
  const accountType = await storage.getAccountType();
  const canonicalTopic = userId ? notificationTopicForAccount(accountType, userId) : "";
  const topics = Array.from(new Set([savedTopic, canonicalTopic].filter(isValidTopic)));

  if (topics.length === 0) {
    console.log("Invalid topic, skipping subscription");
    return;
  }

  try {
    for (const topic of topics) {
      await subscribeWithExpoDeviceToken(topic);
      console.log("Subscribed native FCM token to topic:", topic);
    }
  } catch (error) {
    console.error("Error getting native FCM token or subscribing to topic:", error);
  }
}

export async function showLocalNotification(title: string, body: string, data?: Record<string, any>) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
      data: data || {},
    },
    trigger: null,
  });
}

export async function showWelcomeNotificationOnce() {
  const shown = await storage.getWelcomeNotificationShown();
  if (shown) return;

  await showLocalNotification(
    "Welcome to Maheshwari Infotech",
    "Welcome to Maheshwari Infotech, where we're committed to resolving your complaints efficiently.",
    { type: "welcome" }
  );
  await storage.setWelcomeNotificationShown(true);
}

export async function sendNotification(topic: string, title: string, body: string) {
  if (!topic) return;
  try {
    await sendTopicNotification(topic, title, body);
  } catch (error) {
    console.log("Error sending notification:", error);
  }
}

function isValidTopic(topic: string) {
  return /^[a-zA-Z0-9-_]+$/.test(topic) && topic.length > 0 && topic.length <= 900;
}

export async function sendWebNotification(title: string, body: string) {
  await sendNotification(ADMIN_NOTIFICATION_TOPIC, title, body);
}

export async function customerAddedNotification(fullName: string) {
  // Show local notification
  await showLocalNotification(
    `Customer Added: ${fullName}`,
    `A new customer has been successfully added: ${fullName}.`,
    { type: "customer_added", name: fullName }
  );
  
  // Send to web admin
  return sendWebNotification(
    `Customer Added: ${fullName}`,
    `A new customer has been successfully added: ${fullName}.`
  );
}

export async function newComplaintRaisedNotification(customerName: string) {
  // Show local notification
  return showLocalNotification(
    "Complaint Raised Successfully",
    `Your complaint has been submitted and will be reviewed shortly.`,
    { type: "complaint_raised", customer: customerName }
  );
}

export async function complaintResolvedNotifications(complaintId: string | number, customerTopic?: string) {
  console.log('complaintResolvedNotifications called with:');
  console.log('- Complaint ID:', complaintId);
  console.log('- Customer Topic:', customerTopic);
  
  return showLocalNotification(
    "Complaint Resolved",
    `Complaint [ID: ${complaintId}] has been marked as resolved.`,
    { type: "complaint_resolved", complaintId: complaintId.toString() }
  );
}
