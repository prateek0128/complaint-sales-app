# Maheshwari Complaints App - Notification Setup

## Issues Fixed

### 1. **Missing FCM Integration**
- Added `@react-native-firebase/app` and `@react-native-firebase/messaging` packages
- Configured Firebase Cloud Messaging for push notifications
- Added proper notification channels for Android

### 2. **Web Notifications Not Working**
- Created `firebase-messaging-sw.js` service worker for web notifications
- Added service worker registration in App.tsx
- Created `manifest.json` with FCM sender ID
- Added notification permission request for web platform

### 3. **Notification Handling**
- Implemented foreground notification display (like Flutter app)
- Added background notification handling
- Configured notification channels with proper priority
- Added local notification display for all events

### 4. **Android Permissions**
- Added `POST_NOTIFICATIONS` permission for Android 13+
- Added `RECEIVE_BOOT_COMPLETED` and `WAKE_LOCK` permissions
- Configured FCM service in AndroidManifest.xml
- Added notification metadata (icon, color, channel)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. For Android Development
```bash
npx expo prebuild --clean
npx expo run:android
```

### 3. For Web Development
```bash
npx expo start --web
```

### 4. Notification Testing

**Android:**
- Foreground notifications: App will show notification banner
- Background notifications: System notification tray
- Test with: New complaint, resolved complaint, customer added

**Web:**
- Browser will request notification permission on first launch
- Service worker handles background notifications
- Notifications appear in system notification center

## Key Features Implemented

1. **FCM Push Notifications**: Native push notifications via Firebase
2. **Local Notifications**: In-app notifications for events
3. **Web Push Support**: Browser notifications with service worker
4. **Topic Subscriptions**: Subscribe to user-specific notification topics
5. **Notification Channels**: High priority channels for important alerts
6. **Permission Handling**: Automatic permission requests
7. **Foreground Display**: Show notifications even when app is active

## Notification Flow

1. **User Registration**: Shows "Customer Added" notification
2. **Raise Complaint**: Shows "Complaint Raised Successfully" + admin notification
3. **Complaint Resolved**: Shows customer notification + admin notification
4. **Welcome**: One-time welcome notification on first app launch

## Files Modified/Created

- `src/utils/notifications.ts` - Enhanced with FCM integration
- `App.tsx` - Added web notification initialization
- `package.json` - Added Firebase packages
- `app.config.js` - Added FCM plugins
- `firebase-messaging-sw.js` - Web service worker
- `manifest.json` - PWA manifest with FCM config
- `android/app/src/main/AndroidManifest.xml` - FCM permissions & service
- `register-sw.js` - Service worker registration

## Testing Checklist

- [ ] Welcome notification on first launch
- [ ] Complaint raised notification
- [ ] Complaint resolved notification
- [ ] Customer added notification
- [ ] Web browser notification popup
- [ ] Android foreground notifications
- [ ] Android background notifications
- [ ] Topic subscription working
