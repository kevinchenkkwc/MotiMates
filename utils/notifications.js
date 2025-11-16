import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token?.data;
}

export async function scheduleSessionReminder(sessionTitle, sessionTime) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Focus Session Starting Soon',
      body: `"${sessionTitle}" starts in 5 minutes. Get ready to lock in!`,
      data: { sessionTitle, sessionTime },
    },
    trigger: {
      date: new Date(sessionTime - 5 * 60 * 1000), // 5 minutes before
    },
  });
}

export async function scheduleFriendMotivation(friendName) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${friendName} is waiting!`,
      body: 'Your study partner is ready to start the session.',
    },
    trigger: null, // Send immediately
  });
}
