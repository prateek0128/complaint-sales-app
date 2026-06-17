import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { sendTopicNotification, subscribeNotificationTopic } from "../api/api";
import { storage } from "./storage";

const ADMIN_NOTIFICATION_TOPIC = "notification";

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

  console.log("Notification permission:", finalStatus);

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
  const topic = await storage.getSubscribeToken();
  if (!isValidTopic(topic)) {
    console.log("Invalid topic, skipping subscription");
    return;
  }

  try {
    // Get Expo push token
    const expoPushToken = await Notifications.getExpoPushTokenAsync();
    console.log("Expo push token:", expoPushToken.data);

    // Try to get native FCM token if available
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      const nativeToken = deviceToken.data;
      console.log("Native FCM token:", nativeToken);
      
      if (nativeToken && typeof nativeToken === "string") {
        await subscribeNotificationTopic(nativeToken, topic);
        console.log("Subscribed native FCM token to topic:", topic);
        return;
      }
    } catch (nativeError) {
      console.log("Native FCM token not available, using Expo token:", nativeError);
    }

    // Fallback to Expo token
    if (expoPushToken.data) {
      await subscribeNotificationTopic(expoPushToken.data, topic);
      console.log("Subscribed Expo token to topic:", topic);
    }
  } catch (error) {
    console.error("Error subscribing to topic:", error);
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
  await showLocalNotification(
    "Complaint Raised Successfully",
    `Your complaint has been submitted and will be reviewed shortly.`,
    { type: "complaint_raised", customer: customerName }
  );
  
  // Send to web admin
  return sendWebNotification(
    "New Complaint Raised",
    `A new complaint has been raised by ${customerName}. Please review and assign it to a technician.`
  );
}

export async function complaintResolvedNotifications(complaintId: string | number, customerTopic?: string) {
  console.log('complaintResolvedNotifications called with:');
  console.log('- Complaint ID:', complaintId);
  console.log('- Customer Topic:', customerTopic);
  
  // Show local notification to customer
  await showLocalNotification(
    "Complaint Resolved",
    `Your complaint [ID: ${complaintId}] has been successfully resolved!`,
    { type: "complaint_resolved", complaintId: complaintId.toString() }
  );
  
  // Send push notification to customer if topic is valid
  if (customerTopic && isValidTopic(customerTopic)) {
    try {
      console.log('Sending notification to customer topic:', customerTopic);
      await sendNotification(
        customerTopic,
        "Your Complaint Has Been Resolved",
        `Your complaint [Complaint ID: ${complaintId}] has been resolved by our technician.`
      );
      console.log('Customer notification sent successfully');
    } catch (error) {
      console.error('Error sending customer notification:', error);
    }
  } else {
    console.warn('Invalid or missing customer topic, skipping customer notification');
  }

  // Notify web admin
  try {
    const technicianName = await storage.getInfoName();
    console.log('Sending admin notification for technician:', technicianName);
    await sendWebNotification(
      "Complaint Resolved",
      `The complaint [Complaint ID: ${complaintId}] assigned to ${technicianName} has been marked as resolved.`
    );
    console.log('Admin notification sent successfully');
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}
