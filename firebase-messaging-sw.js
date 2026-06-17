// firebase-messaging-sw.js for React Native Web
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase with the same config as google-services.json
firebase.initializeApp({
  apiKey: "AIzaSyCrcS_FzkEnhDfZAIHmdp_KfRAY9CrPufY",
  authDomain: "miiscollpcomplaintapp.firebaseapp.com",
  projectId: "miiscollpcomplaintapp",
  storageBucket: "miiscollpcomplaintapp.appspot.com",
  messagingSenderId: "1035230545456",
  appId: "1:1035230545456:android:b10000da5bcfc089becff5"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/assets/frame5.png',
    badge: '/assets/frame5.png',
    tag: `notification-${Date.now()}`,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
