import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { sendTopicNotification, subscribeNotificationTopic } from "../api/api";
import { storage } from "./storage";

const ADMIN_NOTIFICATION_TOPIC = "notification";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function initializeNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6366F1",
    });
  }

  const permission = await Notifications.requestPermissionsAsync();
  console.log("Notification permission:", permission.status);
  Notifications.addNotificationReceivedListener(notification => {
    console.log("Foreground notification received:", notification.request.content.title);
  });
  Notifications.addNotificationResponseReceivedListener(response => {
    console.log("Notification clicked:", response.notification.request.content.data);
  });
}

export async function addSubscribeTopic() {
  const topic = await storage.getSubscribeToken();
  if (!isValidTopic(topic)) return;

  try {
    const token = (await Notifications.getDevicePushTokenAsync()).data;
    console.log("Native FCM token:", token);
    if (token) {
      await subscribeNotificationTopic(token, topic);
      console.log("Subscribed native token to topic:", topic);
    }
  } catch (error) {
    console.log("Unable to subscribe native push token to topic in this runtime:", error);
  }
}

export async function showLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null
  });
}

export async function showWelcomeNotificationOnce() {
  const shown = await storage.getWelcomeNotificationShown();
  if (shown) return;

  await showLocalNotification(
    "Welcome to Maheshwari Infotech",
    "Welcome to Maheshwari Infotech, where we're committed to resolving your complaints efficiently."
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

export function customerAddedNotification(fullName: string) {
  return sendWebNotification(
    `Customer Added: ${fullName}`,
    `A new customer has been successfully added: ${fullName}.`
  );
}

export function newComplaintRaisedNotification(customerName: string) {
  return sendWebNotification(
    "New Complaint Raised",
    `A new complaint has been raised by ${customerName}. Please review and assign it to a technician.`
  );
}

export async function complaintResolvedNotifications(complaintId: string | number, customerTopic?: string) {
  await sendNotification(
    customerTopic ?? "",
    "Your Complaint Has Been Resolved",
    `Your complaint [Complaint ID: ${complaintId}] has been resolved by our technician.`
  );

  const technicianName = await storage.getInfoName();
  await sendWebNotification(
    "Complaint Resolved",
    `The complaint [Complaint ID: ${complaintId}] assigned to ${technicianName} has been marked as resolved.`
  );
}
